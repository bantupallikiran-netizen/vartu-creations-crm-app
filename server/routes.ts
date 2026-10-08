import { Router } from 'express';
import {
  initializeTables,
  getCustomersSql,
  insertCustomerSql,
  updateCustomerSql,
  getLeadsSql,
  insertLeadSql,
  updateLeadSql,
  getProductsSql,
  insertProductSql,
  getQuotationsSql,
  insertQuotationSql,
  getOrdersSql,
  insertOrderSql,
  updateOrderSql,
  getProductionSql,
  updateProductionRecordSql,
  getInventorySql,
  insertInventorySql,
  updateInventoryStockSql,
  getPaymentsSql,
  insertPaymentSql,
  getInvoicesSql,
  insertInvoiceSql,
  updateInvoiceSql,
  getDispatchesSql,
  insertDispatchSql,
  getFollowUpsSql,
  insertFollowUpSql,
  completeFollowUpSql,
  getUsersSql,
  insertUserSql,
  getSettingsSql,
  saveSettingsSql,
} from './sqlService.ts';
import { seedVartuCrmDatabase } from './seedService.ts';
import { testDbConnection, sqlConfig, isDbAvailable } from './db.ts';
import {
  initialCustomers,
  initialDispatches,
  initialFollowUps,
  initialInventory,
  initialInvoices,
  initialLeads,
  initialOrders,
  initialPayments,
  initialProducts,
  initialProduction,
  initialQuotations,
  initialSettings,
} from '../src/data/mockData.ts';

export const apiRouter = Router();

// In-memory fallback stores when SQL Server is offline in cloud preview
let localCustomers = [...initialCustomers];
let localLeads = [...initialLeads];
let localProducts = [...initialProducts];
let localQuotations = [...initialQuotations];
let localOrders = [...initialOrders];
let localProduction = [...initialProduction];
let localInventory = [...initialInventory];
let localPayments = [...initialPayments];
let localInvoices = [...initialInvoices];
let localDispatches = [...initialDispatches];
let localFollowUps = [...initialFollowUps];
let localSettings = { ...initialSettings };

// --- DB STATUS & SEED ---
apiRouter.get('/db/health', async (_req, res) => {
  try {
    const status = await testDbConnection();
    res.json({
      success: status.connected,
      server: status.server || sqlConfig.server,
      database: status.database || sqlConfig.database,
      status: status.connected ? 'ONLINE' : 'OFFLINE',
      auth: status.authType || 'Windows Authentication (Integrated Security)',
      windowsUser: status.currentUser || null,
      driver: status.driver || 'msnodesqlv8',
      message: status.message,
      architecture: 'React Frontend -> Node.js Backend API -> SQL Server (VartuCRM)',
    });
  } catch (error: any) {
    res.json({
      success: false,
      server: sqlConfig.server,
      database: sqlConfig.database,
      status: 'OFFLINE',
      auth: 'Windows Authentication (Integrated Security)',
      message: error.message || 'Offline',
      architecture: 'React Frontend -> Node.js Backend API -> SQL Server (VartuCRM)',
    });
  }
});

apiRouter.post('/db/init-tables', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (!isAvail) {
      return res.json({ success: false, message: `SQL Server ${sqlConfig.server} is offline or unreachable.` });
    }
    const result = await initializeTables();
    res.json(result);
  } catch (err: any) {
    res.json({ success: false, message: err.message });
  }
});

apiRouter.post('/db/seed', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (!isAvail) {
      return res.json({ success: false, message: `SQL Server ${sqlConfig.server} is offline or unreachable.` });
    }
    const result = await seedVartuCrmDatabase();
    res.json(result);
  } catch (err: any) {
    res.json({ success: false, message: err.message });
  }
});

// --- BOOTSTRAP (Loads full CRM state from SQL Server or synchronized store) ---
apiRouter.get('/bootstrap', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (!isAvail) {
      return res.json({
        source: 'LOCAL_PREVIEW',
        connected: false,
        server: sqlConfig.server,
        database: sqlConfig.database,
        message: `SQL Server ${sqlConfig.server} is local to your Windows machine. Running in synchronized local mode.`,
        data: {
          settings: localSettings,
          customers: localCustomers,
          leads: localLeads,
          products: localProducts,
          quotations: localQuotations,
          orders: localOrders,
          production: localProduction,
          inventory: localInventory,
          payments: localPayments,
          invoices: localInvoices,
          dispatches: localDispatches,
          followUps: localFollowUps,
          users: [
            {
              id: 'usr-admin-1',
              email: 'connect@vartucreations.com',
              fullName: 'Vartu Lead Artisan & Admin',
              role: 'Owner/Admin',
              isActive: true,
            },
          ],
        },
      });
    }

    // Ensure tables exist
    await initializeTables();

    // Query all entities in parallel from SQL Server
    const [
      customers,
      leads,
      products,
      quotations,
      orders,
      production,
      inventory,
      payments,
      invoices,
      dispatches,
      followUps,
      users,
      settingsDb,
    ] = await Promise.all([
      getCustomersSql().catch(() => localCustomers),
      getLeadsSql().catch(() => localLeads),
      getProductsSql().catch(() => localProducts),
      getQuotationsSql().catch(() => localQuotations),
      getOrdersSql().catch(() => localOrders),
      getProductionSql().catch(() => localProduction),
      getInventorySql().catch(() => localInventory),
      getPaymentsSql().catch(() => localPayments),
      getInvoicesSql().catch(() => localInvoices),
      getDispatchesSql().catch(() => localDispatches),
      getFollowUpsSql().catch(() => localFollowUps),
      getUsersSql().catch(() => []),
      getSettingsSql().catch(() => null),
    ]);

    let finalCustomers = customers;
    let finalProducts = products;
    let finalOrders = orders;
    let finalLeads = leads;
    let finalQuotations = quotations;
    let finalProduction = production;
    let finalInventory = inventory;
    let finalPayments = payments;
    let finalInvoices = invoices;
    let finalDispatches = dispatches;
    let finalFollowUps = followUps;

    if (products.length === 0 && customers.length === 0) {
      console.log('[SQL Server] Empty VartuCRM database detected. Auto-seeding initial craft catalogue...');
      await seedVartuCrmDatabase();
      finalCustomers = await getCustomersSql().catch(() => localCustomers);
      finalProducts = await getProductsSql().catch(() => localProducts);
      finalOrders = await getOrdersSql().catch(() => localOrders);
      finalLeads = await getLeadsSql().catch(() => localLeads);
      finalQuotations = await getQuotationsSql().catch(() => localQuotations);
      finalProduction = await getProductionSql().catch(() => localProduction);
      finalInventory = await getInventorySql().catch(() => localInventory);
      finalPayments = await getPaymentsSql().catch(() => localPayments);
      finalInvoices = await getInvoicesSql().catch(() => localInvoices);
      finalDispatches = await getDispatchesSql().catch(() => localDispatches);
      finalFollowUps = await getFollowUpsSql().catch(() => localFollowUps);
    }

    res.json({
      source: 'SQL_SERVER',
      connected: true,
      server: sqlConfig.server,
      database: sqlConfig.database,
      data: {
        settings: settingsDb || localSettings,
        customers: finalCustomers,
        leads: finalLeads,
        products: finalProducts,
        quotations: finalQuotations,
        orders: finalOrders,
        production: finalProduction,
        inventory: finalInventory,
        payments: finalPayments,
        invoices: finalInvoices,
        dispatches: finalDispatches,
        followUps: finalFollowUps,
        users,
      },
    });
  } catch (err: any) {
    res.json({
      source: 'LOCAL_PREVIEW',
      connected: false,
      server: sqlConfig.server,
      database: sqlConfig.database,
      data: {
        settings: localSettings,
        customers: localCustomers,
        leads: localLeads,
        products: localProducts,
        quotations: localQuotations,
        orders: localOrders,
        production: localProduction,
        inventory: localInventory,
        payments: localPayments,
        invoices: localInvoices,
        dispatches: localDispatches,
        followUps: localFollowUps,
      },
    });
  }
});

// --- CUSTOMERS ---
apiRouter.get('/customers', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getCustomersSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localCustomers, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/customers', async (req, res) => {
  const customerData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertCustomerSql(customerData);
      localCustomers = [saved, ...localCustomers.filter((c) => c.id !== saved.id)];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    console.log('[Customers API] SQL Server offline, storing in local synchronized store:', err.message);
  }
  localCustomers = [customerData, ...localCustomers.filter((c) => c.id !== customerData.id)];
  res.json({ success: true, data: customerData, source: 'LOCAL_PREVIEW' });
});

apiRouter.put('/customers/:id', async (req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      await updateCustomerSql(req.params.id, req.body);
    }
  } catch (err: any) {
    // fallback
  }
  localCustomers = localCustomers.map((c) => (c.id === req.params.id ? { ...c, ...req.body } : c));
  res.json({ success: true });
});

// --- LEADS ---
apiRouter.get('/leads', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getLeadsSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localLeads, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/leads', async (req, res) => {
  const leadData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertLeadSql(leadData);
      localLeads = [saved, ...localLeads.filter((l) => l.id !== saved.id)];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    console.log('[Leads API] SQL Server offline, storing in local synchronized store:', err.message);
  }
  localLeads = [leadData, ...localLeads.filter((l) => l.id !== leadData.id)];
  res.json({ success: true, data: leadData, source: 'LOCAL_PREVIEW' });
});

apiRouter.put('/leads/:id', async (req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      await updateLeadSql(req.params.id, req.body);
    }
  } catch (err: any) {
    // fallback
  }
  localLeads = localLeads.map((l) => (l.id === req.params.id ? { ...l, ...req.body } : l));
  res.json({ success: true });
});

// --- PRODUCTS ---
apiRouter.get('/products', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getProductsSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localProducts, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/products', async (req, res) => {
  const prodData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertProductSql(prodData);
      localProducts = [...localProducts, saved];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  localProducts = [...localProducts, prodData];
  res.json({ success: true, data: prodData, source: 'LOCAL_PREVIEW' });
});

// --- QUOTATIONS ---
apiRouter.get('/quotations', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getQuotationsSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localQuotations, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/quotations', async (req, res) => {
  const qtData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertQuotationSql(qtData);
      localQuotations = [saved, ...localQuotations.filter((q) => q.id !== saved.id)];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  localQuotations = [qtData, ...localQuotations.filter((q) => q.id !== qtData.id)];
  res.json({ success: true, data: qtData, source: 'LOCAL_PREVIEW' });
});

// --- ORDERS ---
apiRouter.get('/orders', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getOrdersSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localOrders, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/orders', async (req, res) => {
  const ordData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertOrderSql(ordData);
      localOrders = [saved, ...localOrders.filter((o) => o.id !== saved.id)];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  localOrders = [ordData, ...localOrders.filter((o) => o.id !== ordData.id)];
  res.json({ success: true, data: ordData, source: 'LOCAL_PREVIEW' });
});

apiRouter.put('/orders/:id', async (req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      await updateOrderSql(req.params.id, req.body);
    }
  } catch (err: any) {
    // fallback
  }
  localOrders = localOrders.map((o) => (o.id === req.params.id ? { ...o, ...req.body } : o));
  res.json({ success: true });
});

// --- PRODUCTION ---
apiRouter.get('/production', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getProductionSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localProduction, source: 'LOCAL_PREVIEW' });
});

apiRouter.put('/production/:id', async (req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      await updateProductionRecordSql(req.params.id, req.body);
    }
  } catch (err: any) {
    // fallback
  }
  localProduction = localProduction.map((p) => (p.id === req.params.id ? { ...p, ...req.body } : p));
  res.json({ success: true });
});

// --- INVENTORY ---
apiRouter.get('/inventory', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getInventorySql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localInventory, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/inventory', async (req, res) => {
  const itemData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertInventorySql(itemData);
      localInventory = [...localInventory, saved];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  localInventory = [...localInventory, itemData];
  res.json({ success: true, data: itemData, source: 'LOCAL_PREVIEW' });
});

apiRouter.put('/inventory/:id/stock', async (req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      await updateInventoryStockSql(req.params.id, req.body.newStock);
    }
  } catch (err: any) {
    // fallback
  }
  localInventory = localInventory.map((i) => (i.id === req.params.id ? { ...i, currentStock: req.body.newStock } : i));
  res.json({ success: true });
});

// --- PAYMENTS ---
apiRouter.get('/payments', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getPaymentsSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localPayments, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/payments', async (req, res) => {
  const payData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertPaymentSql(payData);
      localPayments = [saved, ...localPayments.filter((p) => p.id !== saved.id)];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  localPayments = [payData, ...localPayments.filter((p) => p.id !== payData.id)];
  res.json({ success: true, data: payData, source: 'LOCAL_PREVIEW' });
});

// --- INVOICES ---
apiRouter.get('/invoices', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getInvoicesSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localInvoices, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/invoices', async (req, res) => {
  const invData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertInvoiceSql(invData);
      localInvoices = [saved, ...localInvoices.filter((i) => i.id !== saved.id)];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  localInvoices = [invData, ...localInvoices.filter((i) => i.id !== invData.id)];
  res.json({ success: true, data: invData, source: 'LOCAL_PREVIEW' });
});

apiRouter.put('/invoices/:id', async (req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      await updateInvoiceSql(req.params.id, req.body);
    }
  } catch (err: any) {
    // fallback
  }
  localInvoices = localInvoices.map((inv) => (inv.id === req.params.id ? { ...inv, ...req.body } : inv));
  res.json({ success: true });
});

// --- DISPATCHES ---
apiRouter.get('/dispatches', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getDispatchesSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localDispatches, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/dispatches', async (req, res) => {
  const dispData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertDispatchSql(dispData);
      localDispatches = [saved, ...localDispatches.filter((d) => d.id !== saved.id)];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  localDispatches = [dispData, ...localDispatches.filter((d) => d.id !== dispData.id)];
  res.json({ success: true, data: dispData, source: 'LOCAL_PREVIEW' });
});

// --- FOLLOW-UPS ---
apiRouter.get('/followups', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getFollowUpsSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localFollowUps, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/followups', async (req, res) => {
  const flwData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertFollowUpSql(flwData);
      localFollowUps = [...localFollowUps, saved];
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  localFollowUps = [...localFollowUps, flwData];
  res.json({ success: true, data: flwData, source: 'LOCAL_PREVIEW' });
});

apiRouter.put('/followups/:id/complete', async (req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      await completeFollowUpSql(req.params.id);
    }
  } catch (err: any) {
    // fallback
  }
  localFollowUps = localFollowUps.map((f) => (f.id === req.params.id ? { ...f, status: 'Completed' } : f));
  res.json({ success: true });
});

// --- USERS ---
apiRouter.get('/users', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const list = await getUsersSql();
      return res.json({ success: true, data: list, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: [], source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/users', async (req, res) => {
  const userData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await insertUserSql(userData);
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: userData, source: 'LOCAL_PREVIEW' });
});

// --- SETTINGS ---
apiRouter.get('/settings', async (_req, res) => {
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const data = await getSettingsSql();
      return res.json({ success: true, data: data || localSettings, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  res.json({ success: true, data: localSettings, source: 'LOCAL_PREVIEW' });
});

apiRouter.post('/settings', async (req, res) => {
  const settingsData = req.body;
  try {
    const isAvail = await isDbAvailable();
    if (isAvail) {
      const saved = await saveSettingsSql(settingsData);
      localSettings = { ...localSettings, ...saved };
      return res.json({ success: true, data: saved, source: 'SQL_SERVER' });
    }
  } catch (err: any) {
    // fallback
  }
  localSettings = { ...localSettings, ...settingsData };
  res.json({ success: true, data: localSettings, source: 'LOCAL_PREVIEW' });
});
