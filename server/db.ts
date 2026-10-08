import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// SQL Server Configuration for VartuCRM on DESKTOP-BQDO1QT
// Configured for Windows Integrated Authentication (Trusted Connection)
// NO sa account, NO DB_USER, NO DB_PASSWORD required.
const serverName = process.env.DB_SERVER || 'DESKTOP-BQDO1QT';
const dbName = process.env.DB_DATABASE || 'VartuCRM';
const instanceName = process.env.DB_INSTANCE_NAME;
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;
const customDriver = process.env.DB_ODBC_DRIVER;

// Format server target string (supports host, host\instance, or host,port)
const serverTarget = instanceName
  ? `${serverName}\\${instanceName}`
  : (port && port !== 1433 ? `${serverName},${port}` : serverName);

// Candidate ODBC drivers on Windows (tried in order if user hasn't specified DB_ODBC_DRIVER)
const CANDIDATE_DRIVERS = customDriver
  ? [customDriver]
  : [
      'ODBC Driver 17 for SQL Server',
      'ODBC Driver 18 for SQL Server',
      'SQL Server',
      'SQL Server Native Client 11.0',
    ];

export function buildConnectionString(driverName: string): string {
  // If user provided an explicit complete connection string in .env, honor it
  if (process.env.DB_CONNECTION_STRING) {
    return process.env.DB_CONNECTION_STRING;
  }

  // Windows Integrated Authentication: Trusted_Connection=Yes
  // TrustServerCertificate=Yes ensures connection succeeds with self-signed local certs
  return `Server=${serverTarget};Database=${dbName};Trusted_Connection=Yes;TrustServerCertificate=Yes;Driver={${driverName}};`;
}

export const sqlConfig = {
  server: serverName,
  database: dbName,
  instanceName: instanceName || null,
  port: port || 1433,
  authType: 'Windows Authentication (Integrated Security)',
  driver: 'msnodesqlv8',
  trustedConnection: true,
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
};

let activeDriverName = CANDIDATE_DRIVERS[0];
let pool: any = null;
let lastCheckTime = 0;
let lastKnownOnline = false;
let lastErrorMessage = '';
let activeWindowsUser = '';

/**
 * Dynamically resolves the mssql driver.
 * On Windows with msnodesqlv8 installed, loads mssql/msnodesqlv8 for Windows Authentication.
 * In non-Windows/container environments, gracefully falls back to default mssql.
 */
async function getSqlModule(): Promise<any> {
  try {
    const msv8 = await import('mssql/msnodesqlv8.js');
    return msv8.default || msv8;
  } catch (err: any) {
    // Fallback to default mssql driver (tedious)
    const tedious = await import('mssql');
    return tedious.default || tedious;
  }
}

/**
 * Checks if SQL Server is currently reachable.
 * Caches offline state for 15 seconds to avoid UI blocking.
 */
export async function isDbAvailable(): Promise<boolean> {
  const now = Date.now();
  if (pool && pool.connected) {
    return true;
  }

  if (now - lastCheckTime < 15000 && !lastKnownOnline) {
    return false;
  }

  try {
    lastCheckTime = now;
    const testPool = await getDbPool();
    lastKnownOnline = Boolean(testPool && testPool.connected);
    return lastKnownOnline;
  } catch {
    lastKnownOnline = false;
    return false;
  }
}

/**
 * Connects to SQL Server using Windows Integrated Authentication.
 * Automatically tries candidate Windows ODBC drivers if needed.
 */
export async function getDbPool(): Promise<any> {
  if (pool && pool.connected) {
    return pool;
  }

  const sqlModule = await getSqlModule();
  let lastErr: any = null;

  for (const driverName of CANDIDATE_DRIVERS) {
    try {
      const connStr = buildConnectionString(driverName);
      const config: any = {
        connectionString: connStr,
        server: serverName,
        database: dbName,
        driver: 'msnodesqlv8',
        options: {
          trustedConnection: true,
          enableArithAbort: true,
          trustServerCertificate: true,
          useUTC: true,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      };

      const newPool = new sqlModule.ConnectionPool(config);
      await newPool.connect();

      pool = newPool;
      activeDriverName = driverName;
      lastKnownOnline = true;
      lastErrorMessage = '';

      // Fetch active Windows authenticated user
      try {
        const userResult = await pool.request().query('SELECT SUSER_SNAME() as winUser');
        activeWindowsUser = userResult.recordset[0]?.winUser || '';
        console.log(`[SQL Server] Connected successfully to ${serverName}/${dbName} via Windows Authentication (User: ${activeWindowsUser}, Driver: ${driverName})`);
      } catch {
        console.log(`[SQL Server] Connected successfully to ${serverName}/${dbName} via Windows Authentication (Driver: ${driverName})`);
      }

      return pool;
    } catch (err: any) {
      lastErr = err;
      const msg = err.message || '';
      // If error indicates driver was not found, attempt next driver candidate
      if (msg.includes('Data source name not found') || msg.includes('IM002') || msg.includes('driver')) {
        continue;
      }
      // If server unreachable or other fatal error, stop iterating
      break;
    }
  }

  lastKnownOnline = false;
  lastErrorMessage = lastErr?.message || 'Windows Authentication connection failed';
  console.log(`[SQL Server Info] Host ${serverName} is not directly reachable in this runtime (${lastErr?.code || lastErr?.message}). Running with local synchronization layer.`);
  throw lastErr;
}

/**
 * Tests connection to SQL Server database with Windows Authentication diagnostic info.
 */
export async function testDbConnection(): Promise<{
  connected: boolean;
  server: string;
  database: string;
  authType: string;
  driver: string;
  currentUser: string;
  message: string;
}> {
  try {
    const activePool = await getDbPool();
    const result = await activePool.request().query(`
      SELECT 
        @@VERSION as version, 
        DB_NAME() as currentDb, 
        SUSER_SNAME() as currentUser,
        SYSTEM_USER as systemUser,
        GETDATE() as serverTime
    `);
    const row = result.recordset[0];
    return {
      connected: true,
      server: serverName,
      database: row?.currentDb || dbName,
      authType: 'Windows Authentication (Integrated Security)',
      driver: activeDriverName,
      currentUser: row?.currentUser || activeWindowsUser || 'Windows User',
      message: `Connected to ${row?.currentDb || dbName} as ${row?.currentUser || 'Windows User'} at ${row?.serverTime}`,
    };
  } catch (err: any) {
    return {
      connected: false,
      server: serverName,
      database: dbName,
      authType: 'Windows Authentication (Integrated Security)',
      driver: activeDriverName,
      currentUser: '',
      message: `Windows SQL Server (${serverName}/${dbName}) is local to your Windows PC. Start the app locally with 'npm run dev' to authenticate with your Windows login.`,
    };
  }
}

/**
 * Safely executes a SQL query with parameter bindings.
 */
export async function executeQuery<T = any>(
  queryText: string,
  params?: Record<string, { type: sql.ISqlType; value: any }>
): Promise<T[]> {
  const activePool = await getDbPool();
  const request = activePool.request();

  if (params) {
    for (const [key, param] of Object.entries(params)) {
      request.input(key, param.type, param.value);
    }
  }

  const result = await request.query(queryText);
  return result.recordset as T[];
}

export { sql };
