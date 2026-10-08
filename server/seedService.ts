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
import {
  initializeTables,
  insertCustomerSql,
  insertLeadSql,
  insertProductSql,
  insertQuotationSql,
  insertOrderSql,
  insertProductionSql,
  insertInventorySql,
  insertPaymentSql,
  insertInvoiceSql,
  insertDispatchSql,
  insertFollowUpSql,
  insertUserSql,
  saveSettingsSql,
} from './sqlService.ts';
import { getDbPool } from './db.ts';

export async function seedVartuCrmDatabase(): Promise<{ success: boolean; message: string; counts: Record<string, number> }> {
  try {
    // 1. Ensure tables exist
    await initializeTables();
    const pool = await getDbPool();

    const counts: Record<string, number> = {
      users: 0,
      customers: 0,
      leads: 0,
      products: 0,
      quotations: 0,
      orders: 0,
      production: 0,
      inventory: 0,
      payments: 0,
      invoices: 0,
      dispatches: 0,
      followUps: 0,
    };

    // 2. Seed Default Admin User
    const userCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Users');
    if (userCheck.recordset[0].count === 0) {
      await insertUserSql({
        id: 'usr-admin-1',
        email: 'connect@vartucreations.com',
        fullName: 'Vartu Lead Artisan & Admin',
        role: 'Owner/Admin',
        isActive: true,
      });
      counts.users++;
    }

    // 3. Seed Settings
    const settingsCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.CompanySettings');
    if (settingsCheck.recordset[0].count === 0) {
      await saveSettingsSql(initialSettings);
    }

    // 4. Seed Products
    const prodCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Products');
    if (prodCheck.recordset[0].count === 0) {
      for (const prod of initialProducts) {
        await insertProductSql(prod);
        counts.products++;
      }
    }

    // 5. Seed Customers
    const custCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Customers');
    if (custCheck.recordset[0].count === 0) {
      for (const cust of initialCustomers) {
        await insertCustomerSql(cust);
        counts.customers++;
      }
    }

    // 6. Seed Leads
    const leadCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Leads');
    if (leadCheck.recordset[0].count === 0) {
      for (const lead of initialLeads) {
        await insertLeadSql(lead);
        counts.leads++;
      }
    }

    // 7. Seed Quotations
    const qtCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Quotations');
    if (qtCheck.recordset[0].count === 0) {
      for (const qt of initialQuotations) {
        await insertQuotationSql(qt);
        counts.quotations++;
      }
    }

    // 8. Seed Orders
    const ordCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Orders');
    if (ordCheck.recordset[0].count === 0) {
      for (const ord of initialOrders) {
        await insertOrderSql(ord);
        counts.orders++;
      }
    }

    // 9. Seed Production
    const prodRecCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Production');
    if (prodRecCheck.recordset[0].count === 0) {
      for (const rec of initialProduction) {
        await insertProductionSql(rec);
        counts.production++;
      }
    }

    // 10. Seed Inventory
    const invCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Inventory');
    if (invCheck.recordset[0].count === 0) {
      for (const inv of initialInventory) {
        await insertInventorySql(inv);
        counts.inventory++;
      }
    }

    // 11. Seed Payments
    const payCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Payments');
    if (payCheck.recordset[0].count === 0) {
      for (const pay of initialPayments) {
        await insertPaymentSql(pay);
        counts.payments++;
      }
    }

    // 12. Seed Invoices
    const invcCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Invoices');
    if (invcCheck.recordset[0].count === 0) {
      for (const inv of initialInvoices) {
        await insertInvoiceSql(inv);
        counts.invoices++;
      }
    }

    // 13. Seed Dispatches
    const dispCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.Dispatches');
    if (dispCheck.recordset[0].count === 0) {
      for (const disp of initialDispatches) {
        await insertDispatchSql(disp);
        counts.dispatches++;
      }
    }

    // 14. Seed FollowUps
    const flwCheck = await pool.request().query('SELECT COUNT(*) as count FROM dbo.FollowUps');
    if (flwCheck.recordset[0].count === 0) {
      for (const flw of initialFollowUps) {
        await insertFollowUpSql(flw);
        counts.followUps++;
      }
    }

    return {
      success: true,
      message: 'VartuCRM SQL Server seeded successfully',
      counts,
    };
  } catch (error: any) {
    console.error('Seed error:', error);
    return {
      success: false,
      message: error.message || 'Error seeding database',
      counts: {},
    };
  }
}
