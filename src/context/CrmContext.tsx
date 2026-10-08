import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Customer,
  CompanySettings,
  DispatchRecord,
  FollowUp,
  InventoryItem,
  Invoice,
  Lead,
  Order,
  Payment,
  Product,
  ProductionRecord,
  Quotation,
  UserRole,
  CrmDocument,
  ActivityLog,
  StageType,
} from '../types.ts';
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
  initialDocuments,
  initialActivityLogs,
} from '../data/mockData.ts';

interface CrmContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'leadNumber' | 'createdAt' | 'updatedAt'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'customerNumber' | 'createdAt' | 'lifetimeValue'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  checkDuplicateCustomer: (check: { mobile?: string; whatsapp?: string; email?: string; company?: string }) => Customer | null;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  convertQuotationToOrder: (quotationId: string) => Order | null;

  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Order;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: Order['orderStatus']) => void;

  production: ProductionRecord[];
  updateProductionRecord: (id: string, updates: Partial<ProductionRecord>) => void;

  inventory: InventoryItem[];
  updateInventoryStock: (id: string, newStock: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => InventoryItem;

  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'receiptNumber'>) => Payment;

  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  generateInvoiceForOrder: (orderId: string) => Invoice;

  dispatches: DispatchRecord[];
  updateDispatch: (id: string, updates: Partial<DispatchRecord>) => void;

  followUps: FollowUp[];
  addFollowUp: (followUp: Omit<FollowUp, 'id'>) => FollowUp;
  completeFollowUp: (id: string) => void;

  // Documents & Attachments Repository
  documents: CrmDocument[];
  addDocument: (doc: Omit<CrmDocument, 'id' | 'uploadedAt'>) => CrmDocument;
  deleteDocument: (id: string) => void;
  shareDocument: (id: string, channel: 'WhatsApp' | 'Email' | 'Direct Link' | 'Download', recipient?: string) => void;
  addLeadAttachment: (
    leadId: string,
    docData: {
      name: string;
      fileType: CrmDocument['fileType'];
      url: string;
      thumbnailUrl?: string;
      size: string;
      category: string;
      notes?: string;
      mimeType?: string;
    },
    autoShareChannel?: 'WhatsApp' | 'Email' | 'Direct Link'
  ) => { doc: CrmDocument; log: ActivityLog };
  addQuotationAttachment: (
    quotationId: string,
    docData: {
      name: string;
      fileType: CrmDocument['fileType'];
      url: string;
      thumbnailUrl?: string;
      size: string;
      category: string;
      notes?: string;
      mimeType?: string;
    },
    autoShareChannel?: 'WhatsApp' | 'Email' | 'Direct Link'
  ) => { doc: CrmDocument; log: ActivityLog };

  // Activity & Audit Logs
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => ActivityLog;

  // Active view & navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  selectedQuotationId: string | null;
  setSelectedQuotationId: (id: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;

  // Quick Action Dialogs
  quickAction: 'newLead' | 'newQuotation' | 'newOrder' | 'newPayment' | 'newFollowUp' | null;
  setQuickAction: (action: 'newLead' | 'newQuotation' | 'newOrder' | 'newPayment' | 'newFollowUp' | null) => void;

  // SQL Server Database Status & Sync
  dbConnected: boolean;
  dbSource: string;
  dbInfo: { server: string; database: string };
  syncWithSqlServer: () => Promise<void>;
  isSyncing: boolean;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('vartu_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('Owner/Admin');

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('vartu_leads');
    return saved ? JSON.parse(saved) : initialLeads;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('vartu_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('vartu_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('vartu_quotations');
    return saved ? JSON.parse(saved) : initialQuotations;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('vartu_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [production, setProduction] = useState<ProductionRecord[]>(() => {
    const saved = localStorage.getItem('vartu_production');
    return saved ? JSON.parse(saved) : initialProduction;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('vartu_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('vartu_payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('vartu_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [dispatches, setDispatches] = useState<DispatchRecord[]>(() => {
    const saved = localStorage.getItem('vartu_dispatches');
    return saved ? JSON.parse(saved) : initialDispatches;
  });

  const [followUps, setFollowUps] = useState<FollowUp[]>(() => {
    const saved = localStorage.getItem('vartu_followups');
    return saved ? JSON.parse(saved) : initialFollowUps;
  });

  const [documents, setDocuments] = useState<CrmDocument[]>(() => {
    const saved = localStorage.getItem('vartu_documents');
    return saved ? JSON.parse(saved) : initialDocuments;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('vartu_activity_logs');
    return saved ? JSON.parse(saved) : initialActivityLogs;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [quickAction, setQuickAction] = useState<'newLead' | 'newQuotation' | 'newOrder' | 'newPayment' | 'newFollowUp' | null>(null);

  // Database Connection State
  const [dbConnected, setDbConnected] = useState(false);
  const [dbSource, setDbSource] = useState('INITIALIZING');
  const [dbInfo, setDbInfo] = useState({ server: 'DESKTOP-BQDO1QT', database: 'VartuCRM' });
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch full dataset from Node.js Backend connected to SQL Server
  const syncWithSqlServer = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const json = await res.json();
        setDbConnected(Boolean(json.connected));
        setDbSource(json.source || (json.connected ? 'SQL_SERVER' : 'LOCAL_PREVIEW'));
        if (json.server && json.database) {
          setDbInfo({ server: json.server, database: json.database });
        }

        if (json.data) {
          const d = json.data;
          if (d.settings) setSettings(d.settings);
          if (d.customers && d.customers.length > 0) setCustomers(d.customers);
          if (d.leads && d.leads.length > 0) setLeads(d.leads);
          if (d.products && d.products.length > 0) setProducts(d.products);
          if (d.quotations && d.quotations.length > 0) setQuotations(d.quotations);
          if (d.orders && d.orders.length > 0) setOrders(d.orders);
          if (d.production && d.production.length > 0) setProduction(d.production);
          if (d.inventory && d.inventory.length > 0) setInventory(d.inventory);
          if (d.payments && d.payments.length > 0) setPayments(d.payments);
          if (d.invoices && d.invoices.length > 0) setInvoices(d.invoices);
          if (d.dispatches && d.dispatches.length > 0) setDispatches(d.dispatches);
          if (d.followUps && d.followUps.length > 0) setFollowUps(d.followUps);
        }
      }
    } catch (err) {
      console.warn('[CRM Client] Could not contact backend bootstrap API, using local synchronized state:', err);
      setDbConnected(false);
      setDbSource('LOCAL_PREVIEW');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync on initial load
  useEffect(() => {
    syncWithSqlServer();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('vartu_settings', JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem('vartu_leads', JSON.stringify(leads));
  }, [leads]);
  useEffect(() => {
    localStorage.setItem('vartu_customers', JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem('vartu_products', JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem('vartu_quotations', JSON.stringify(quotations));
  }, [quotations]);
  useEffect(() => {
    localStorage.setItem('vartu_orders', JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem('vartu_production', JSON.stringify(production));
  }, [production]);
  useEffect(() => {
    localStorage.setItem('vartu_inventory', JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem('vartu_payments', JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    localStorage.setItem('vartu_invoices', JSON.stringify(invoices));
  }, [invoices]);
  useEffect(() => {
    localStorage.setItem('vartu_dispatches', JSON.stringify(dispatches));
  }, [dispatches]);
  useEffect(() => {
    localStorage.setItem('vartu_followups', JSON.stringify(followUps));
  }, [followUps]);
  useEffect(() => {
    localStorage.setItem('vartu_documents', JSON.stringify(documents));
  }, [documents]);
  useEffect(() => {
    localStorage.setItem('vartu_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((e) => console.warn('Sync settings error:', e));
  };

  const checkDuplicateCustomer = (check: { mobile?: string; whatsapp?: string; email?: string; company?: string }) => {
    return (
      customers.find((c) => {
        if (check.mobile && c.mobile) {
          const m1 = check.mobile.replace(/\D/g, '');
          const m2 = c.mobile.replace(/\D/g, '');
          if (m1 && m2 && (m1 === m2 || m1.slice(-10) === m2.slice(-10))) return true;
        }
        if (check.whatsapp && c.whatsapp) {
          const w1 = check.whatsapp.replace(/\D/g, '');
          const w2 = c.whatsapp.replace(/\D/g, '');
          if (w1 && w2 && (w1 === w2 || w1.slice(-10) === w2.slice(-10))) return true;
        }
        if (check.email && c.email && c.email.toLowerCase().trim() === check.email.toLowerCase().trim()) return true;
        if (check.company && c.company && c.company.toLowerCase().trim() === check.company.toLowerCase().trim()) return true;
        return false;
      }) || null
    );
  };

  const addLead = (leadData: Omit<Lead, 'id' | 'leadNumber' | 'createdAt' | 'updatedAt'>) => {
    const nextSeq = leads.length + 1;
    const leadNumber = `VC-LD-2026-${String(nextSeq).padStart(3, '0')}`;
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      leadNumber,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setLeads((prev) => [newLead, ...prev]);

    // Persist to SQL Server via Backend API
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead),
    }).catch((e) => console.warn('[SQL Sync] Failed to insert lead:', e));

    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : lead))
    );

    // Persist to SQL Server via Backend API
    fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((e) => console.warn('[SQL Sync] Failed to update lead:', e));
  };

  const deleteLead = (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  };

  const addCustomer = (custData: Omit<Customer, 'id' | 'customerNumber' | 'createdAt' | 'lifetimeValue'>) => {
    const nextSeq = customers.length + 1;
    const customerNumber = `VC-CUST-${String(nextSeq).padStart(4, '0')}`;
    const newCustomer: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      customerNumber,
      lifetimeValue: custData.totalPurchaseValue || 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    // Persist to SQL Server via Backend API
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    }).catch((e) => console.warn('[SQL Sync] Failed to insert customer:', e));

    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, lifetimeValue: updates.totalPurchaseValue ?? c.totalPurchaseValue } : c))
    );

    // Persist to SQL Server via Backend API
    fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((e) => console.warn('[SQL Sync] Failed to update customer:', e));
  };

  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProduct]);

    // Persist to SQL Server via Backend API
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    }).catch((e) => console.warn('[SQL Sync] Failed to insert product:', e));

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const addQuotation = (qtData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>) => {
    const nextSeq = quotations.length + 1;
    const quotationNumber = `${settings.quotationPrefix}${String(nextSeq).padStart(4, '0')}`;
    const newQt: Quotation = {
      ...qtData,
      id: `qt-${Date.now()}`,
      quotationNumber,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setQuotations((prev) => [newQt, ...prev]);

    // Persist to SQL Server via Backend API
    fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQt),
    }).catch((e) => console.warn('[SQL Sync] Failed to insert quotation:', e));

    return newQt;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const convertQuotationToOrder = (quotationId: string): Order | null => {
    const qt = quotations.find((q) => q.id === quotationId);
    if (!qt) return null;

    // Check customer
    let cust = customers.find((c) => c.id === qt.customerId);
    if (!cust) {
      cust = addCustomer({
        name: qt.customerName,
        mobile: qt.customerMobile,
        whatsapp: qt.customerMobile,
        email: qt.customerEmail,
        address: { street: qt.customerAddress, city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
        customerType: 'Retail',
        customerSource: 'Quotation',
        totalOrders: 1,
        totalPurchaseValue: qt.grandTotal,
        outstandingAmount: qt.balanceAmount,
        customerRating: 5,
      });
    } else {
      updateCustomer(cust.id, {
        totalOrders: (cust.totalOrders || 0) + 1,
        totalPurchaseValue: (cust.totalPurchaseValue || 0) + qt.grandTotal,
        outstandingAmount: (cust.outstandingAmount || 0) + qt.balanceAmount,
        lastOrderDate: new Date().toISOString().split('T')[0],
      });
    }

    const nextSeq = orders.length + 1;
    const orderNumber = `${settings.orderPrefix}${String(nextSeq).padStart(4, '0')}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: cust.id,
      customerName: qt.customerName,
      customerMobile: qt.customerMobile,
      customerEmail: qt.customerEmail,
      customerAddress: qt.customerAddress,
      quotationId: qt.id,
      orderDate: new Date().toISOString().split('T')[0],
      requiredDeliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      orderType: qt.items.length > 20 ? 'Bulk' : 'Customized',
      priority: 'High',
      items: qt.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        customizationDetails: item.customizationNotes
          ? {
              specialInstructions: item.customizationNotes,
              approvalStatus: 'Approved',
              approvalDate: new Date().toISOString().split('T')[0],
              version: 1,
            }
          : undefined,
        total: item.itemTotal,
      })),
      totalValue: qt.grandTotal,
      advanceRequired: qt.advanceRequired,
      advanceReceived: 0,
      balanceAmount: qt.grandTotal,
      paymentStatus: 'Pending',
      productionStatus: 'Production Pending',
      dispatchStatus: 'Not Dispatched',
      orderStatus: 'Order Confirmed',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Create production records
    for (const item of newOrder.items) {
      const prodRecord: ProductionRecord = {
        id: `prod-rec-${Date.now()}-${Math.random()}`,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        productName: item.productName,
        sku: item.sku,
        requiredQty: item.quantity,
        producedQty: 0,
        rejectedQty: 0,
        balanceQty: item.quantity,
        startDate: new Date().toISOString().split('T')[0],
        expectedCompletionDate: newOrder.requiredDeliveryDate,
        status: 'Pending',
        controller: 'Studio Lead',
      };
      setProduction((prev) => [...prev, prodRecord]);
    }

    // Mark quotation as Accepted
    updateQuotation(quotationId, { status: 'Accepted' });

    return newOrder;
  };

  const addOrder = (ordData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
    const nextSeq = orders.length + 1;
    const prefix = settings.orderPrefix || 'VC-ORD-2026-';
    const orderNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    const newOrd: Order = {
      ...ordData,
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setOrders((prev) => [newOrd, ...prev]);

    // Update customer stats if customer exists
    if (newOrd.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== newOrd.customerId) return c;
          const totalOrders = (c.totalOrders || 0) + 1;
          const totalPurchaseValue = (c.totalPurchaseValue || 0) + (newOrd.totalValue || 0);
          const outstandingAmount = (c.outstandingAmount || 0) + (newOrd.balanceAmount || 0);
          return {
            ...c,
            totalOrders,
            totalPurchaseValue,
            outstandingAmount,
            lifetimeValue: totalPurchaseValue,
            lastOrderDate: newOrd.orderDate || new Date().toISOString().split('T')[0],
          };
        })
      );
    }

    // Auto add production records
    if (newOrd.items && newOrd.items.length > 0) {
      const prodRecords: ProductionRecord[] = newOrd.items.map((item, idx) => ({
        id: `prod-rec-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        orderId: newOrd.id,
        orderNumber: newOrd.orderNumber,
        productName: item.productName,
        sku: item.sku || 'SKU-GEN',
        requiredQty: item.quantity || 1,
        producedQty: 0,
        rejectedQty: 0,
        balanceQty: item.quantity || 1,
        expectedCompletionDate: newOrd.requiredDeliveryDate || new Date().toISOString().split('T')[0],
        status: 'Pending',
        controller: 'Studio Lead',
      }));
      setProduction((prev) => [...prodRecords, ...prev]);
    }

    // Persist to SQL Server via Backend API
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrd),
    }).catch((e) => console.warn('[SQL Sync] Failed to insert order:', e));

    return newOrd;
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));

    // Persist to SQL Server via Backend API
    fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((e) => console.warn('[SQL Sync] Failed to update order:', e));
  };

  const updateOrderStatus = (id: string, status: Order['orderStatus']) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const updates: Partial<Order> = { orderStatus: status };
        if (status === 'Dispatched') {
          updates.dispatchStatus = 'Dispatched';
        } else if (status === 'Delivered') {
          updates.dispatchStatus = 'Delivered';
          updates.productionStatus = 'Completed';
        } else if (status === 'Payment Received') {
          updates.paymentStatus = 'Paid';
        }
        return { ...o, ...updates };
      })
    );

    // Persist to SQL Server via Backend API
    fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: status }),
    }).catch((e) => console.warn('[SQL Sync] Failed to update order status:', e));
  };

  const updateProductionRecord = (id: string, updates: Partial<ProductionRecord>) => {
    setProduction((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const produced = updates.producedQty ?? rec.producedQty;
        const rejected = updates.rejectedQty ?? rec.rejectedQty;
        const balance = Math.max(0, rec.requiredQty - (produced + rejected));
        return { ...rec, ...updates, balanceQty: balance };
      })
    );

    // Persist to SQL Server via Backend API
    fetch(`/api/production/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((e) => console.warn('[SQL Sync] Failed to update production:', e));
  };

  const updateInventoryStock = (id: string, newStock: number) => {
    setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, currentStock: newStock } : item)));

    // Persist to SQL Server via Backend API
    fetch(`/api/inventory/${id}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStock }),
    }).catch((e) => console.warn('[SQL Sync] Failed to update inventory stock:', e));
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
    };
    setInventory((prev) => [...prev, newItem]);

    // Persist to SQL Server via Backend API
    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    }).catch((e) => console.warn('[SQL Sync] Failed to insert inventory item:', e));

    return newItem;
  };

  const addPayment = (paymentData: Omit<Payment, 'id' | 'receiptNumber'>) => {
    const nextSeq = payments.length + 1;
    const receiptNumber = `VC-RCT-2026-${String(nextSeq).padStart(3, '0')}`;
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber,
    };
    setPayments((prev) => [newPayment, ...prev]);

    // Persist to SQL Server via Backend API
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPayment),
    }).catch((e) => console.warn('[SQL Sync] Failed to insert payment:', e));

    // Update order received & balance safely with functional updater
    if (paymentData.orderId) {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== paymentData.orderId) return order;
          let totalPaid = order.advanceReceived;
          if (order.advanceReceived === 0 || order.advanceReceived < paymentData.amount) {
            totalPaid = (order.advanceReceived || 0) + paymentData.amount;
          } else if (paymentData.notes && !paymentData.notes.includes('Advance payment')) {
            totalPaid = (order.advanceReceived || 0) + paymentData.amount;
          }
          const balance = Math.max(0, order.totalValue - totalPaid);
          const paymentStatus = balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Pending';
          return {
            ...order,
            advanceReceived: totalPaid,
            balanceAmount: balance,
            paymentStatus,
          };
        })
      );
    }

    // Auto-update linked invoice(s): recalculate amountPaid, balanceDue, and status in real-time
    if (paymentData.orderId || paymentData.orderNumber || (paymentData as any).invoiceId) {
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) => {
          const isMatch =
            (paymentData.orderId && inv.orderId === paymentData.orderId) ||
            (paymentData.orderNumber && inv.orderNumber === paymentData.orderNumber) ||
            ((paymentData as any).invoiceId && inv.id === (paymentData as any).invoiceId);

          if (!isMatch) return inv;

          let newPaid = (inv.amountPaid || 0) + paymentData.amount;
          if (
            paymentData.notes &&
            paymentData.notes.includes('Advance payment') &&
            inv.amountPaid === paymentData.amount
          ) {
            newPaid = inv.amountPaid;
          }
          const newBalance = Math.max(0, inv.grandTotal - newPaid);
          const newStatus =
            newBalance <= 0
              ? 'Paid'
              : newPaid > 0
              ? 'Partially Paid'
              : inv.status;

          return {
            ...inv,
            amountPaid: newPaid,
            balanceDue: newBalance,
            status: newStatus,
          };
        })
      );
    }

    return newPayment;
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const nextSeq = invoices.length + 1;
    const prefix = settings.invoicePrefix || 'VC-INV-2026-';
    const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `invc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber,
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    // Persist to SQL Server via Backend API
    fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvoice),
    }).catch((e) => console.warn('[SQL Sync] Failed to insert invoice:', e));

    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const updated = { ...inv, ...updates };
        if (updates.amountPaid !== undefined || updates.grandTotal !== undefined) {
          const paid = updates.amountPaid ?? updated.amountPaid;
          const total = updates.grandTotal ?? updated.grandTotal;
          updated.balanceDue = Math.max(0, total - paid);
          if (updated.balanceDue <= 0) {
            updated.status = 'Paid';
          } else if (paid > 0) {
            updated.status = 'Partially Paid';
          }
        }
        return updated;
      })
    );

    // Persist to SQL Server via Backend API
    fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((e) => console.warn('[SQL Sync] Failed to update invoice:', e));
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const generateInvoiceForOrder = (orderId: string): Invoice => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Order not found with ID: ${orderId}`);
    }

    // Check if an invoice already exists for this order
    const existing = invoices.find((inv) => inv.orderId === orderId);
    if (existing) {
      return existing;
    }

    const nextSeq = invoices.length + 1;
    const prefix = settings.invoicePrefix || 'VC-INV-2026-';
    const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    // Calculate existing payments for this order
    const orderPayments = payments.filter((p) => p.orderId === order.id && p.status === 'Completed');
    const recordedPaid = orderPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const amountPaid = Math.max(order.advanceReceived || 0, recordedPaid);

    const subtotal = order.totalValue || 0;
    // GST computation: 18% (intrastate: 9% CGST + 9% SGST, interstate: 18% IGST)
    const gstRate = settings.defaultGstRate || 18;
    const isInterState =
      Boolean(order.customerAddress) &&
      !order.customerAddress.toLowerCase().includes('telangana') &&
      !order.customerAddress.toLowerCase().includes('hyderabad');

    const cgst = isInterState ? 0 : Math.round((subtotal * (gstRate / 2)) / 100);
    const sgst = isInterState ? 0 : Math.round((subtotal * (gstRate / 2)) / 100);
    const igst = isInterState ? Math.round((subtotal * gstRate) / 100) : 0;
    const grandTotal = subtotal + cgst + sgst + igst;
    const balanceDue = Math.max(0, grandTotal - amountPaid);
    const status: Invoice['status'] =
      balanceDue <= 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Issued';

    const cust = customers.find((c) => c.id === order.customerId);

    const newInvoice: Invoice = {
      id: `invc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      customerEmail: order.customerEmail || cust?.email,
      customerGstin: cust?.gstin,
      billingAddress: order.customerAddress,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate:
        order.requiredDeliveryDate ||
        new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: order.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        customizationDetails:
          it.customizationDetails?.nameText || it.customizationDetails?.specialInstructions,
        total: it.total,
      })),
      gstRatePercent: gstRate,
      gstType: isInterState ? 'IGST' : 'CGST_SGST',
      subtotal,
      cgst,
      sgst,
      igst,
      grandTotal,
      amountPaid,
      balanceDue,
      status,
      notes: `Tax invoice for order ${order.orderNumber}. Handcrafted with precision by Vartu Creations.`,
      termsAndConditions:
        '1. Handcrafted items are uniquely produced to order.\n2. Balance must be cleared prior to delivery/dispatch.\n3. Make UPI payments to vartucreations@okhdfcbank.',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  };

  const updateDispatch = (id: string, updates: Partial<DispatchRecord>) => {
    setDispatches((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const addFollowUp = (followUpData: Omit<FollowUp, 'id'>) => {
    const newFollowUp: FollowUp = {
      ...followUpData,
      id: `flw-${Date.now()}`,
    };
    setFollowUps((prev) => [newFollowUp, ...prev]);

    // Persist to SQL Server via Backend API
    fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFollowUp),
    }).catch((e) => console.warn('[SQL Sync] Failed to insert follow-up:', e));

    return newFollowUp;
  };

  const completeFollowUp = (id: string) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'Completed', completedAt: new Date().toISOString() } : f))
    );

    // Persist to SQL Server via Backend API
    fetch(`/api/followups/${id}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }).catch((e) => console.warn('[SQL Sync] Failed to complete follow-up:', e));
  };

  const addActivityLog = (logData: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog => {
    const newLog: ActivityLog = {
      ...logData,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  const addDocument = (docData: Omit<CrmDocument, 'id' | 'uploadedAt'>): CrmDocument => {
    const newDoc: CrmDocument = {
      ...docData,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      sharedChannels: docData.sharedChannels || [],
    };
    setDocuments((prev) => [newDoc, ...prev]);

    // Automatically record an activity log with respect to this stage
    addActivityLog({
      stage: docData.stage,
      entityId: docData.linkedEntityId,
      entityNumber: docData.linkedEntityNumber,
      customerName: docData.linkedCustomerName,
      action: 'ATTACHMENT_UPLOADED',
      title: `${docData.stage} Stage: Uploaded ${docData.name}`,
      description: `Stored "${docData.name}" (${docData.size}) in Documents under category "${docData.category}".`,
      metadata: {
        documentId: newDoc.id,
        fileName: docData.name,
        fileType: docData.fileType,
        category: docData.category,
        url: docData.url,
      },
      performedBy: docData.uploadedBy || 'Vartu Studio',
    });

    return newDoc;
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const shareDocument = (
    id: string,
    channel: 'WhatsApp' | 'Email' | 'Direct Link' | 'Download',
    recipient?: string
  ) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    let targetDoc: CrmDocument | undefined;

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === id) {
          targetDoc = doc;
          const currentChannels = doc.sharedChannels || [];
          const nextChannels = currentChannels.includes(channel) ? currentChannels : [...currentChannels, channel];
          return {
            ...doc,
            sharedChannels: nextChannels,
            lastSharedAt: now,
          };
        }
        return doc;
      })
    );

    const docToLog = targetDoc || documents.find((d) => d.id === id);
    if (docToLog) {
      addActivityLog({
        stage: docToLog.stage,
        entityId: docToLog.linkedEntityId,
        entityNumber: docToLog.linkedEntityNumber,
        customerName: docToLog.linkedCustomerName,
        action: 'ATTACHMENT_SHARED',
        title: `${docToLog.stage} Stage: Shared ${docToLog.name} via ${channel}`,
        description: `Shared "${docToLog.name}" with ${docToLog.linkedCustomerName}${recipient ? ` (${recipient})` : ''} via ${channel}.`,
        metadata: {
          documentId: docToLog.id,
          fileName: docToLog.name,
          fileType: docToLog.fileType,
          shareChannel: channel,
          sharedTo: recipient || docToLog.customerMobile || docToLog.customerEmail,
          category: docToLog.category,
          url: docToLog.url,
        },
        performedBy: 'Vartu Team',
      });
    }
  };

  const addLeadAttachment = (
    leadId: string,
    docData: {
      name: string;
      fileType: CrmDocument['fileType'];
      url: string;
      thumbnailUrl?: string;
      size: string;
      category: string;
      notes?: string;
      mimeType?: string;
    },
    autoShareChannel?: 'WhatsApp' | 'Email' | 'Direct Link'
  ) => {
    const targetLead = leads.find((l) => l.id === leadId);
    const leadName = targetLead ? targetLead.customerName : 'Lead Contact';
    const leadNum = targetLead ? targetLead.leadNumber : undefined;
    const leadPhone = targetLead ? targetLead.whatsapp || targetLead.mobile : undefined;
    const leadEmail = targetLead ? targetLead.email : undefined;

    const doc = addDocument({
      name: docData.name,
      fileType: docData.fileType,
      mimeType: docData.mimeType,
      url: docData.url,
      thumbnailUrl: docData.thumbnailUrl,
      size: docData.size,
      stage: 'Lead',
      linkedEntityId: leadId,
      linkedEntityNumber: leadNum,
      linkedCustomerName: leadName,
      customerMobile: leadPhone,
      customerEmail: leadEmail,
      category: docData.category,
      notes: docData.notes,
      uploadedBy: 'Vartu Sales',
      sharedChannels: autoShareChannel ? [autoShareChannel] : [],
      lastSharedAt: autoShareChannel ? new Date().toISOString().replace('T', ' ').substring(0, 16) : undefined,
    });

    let log: ActivityLog;
    if (autoShareChannel) {
      log = addActivityLog({
        stage: 'Lead',
        entityId: leadId,
        entityNumber: leadNum,
        customerName: leadName,
        action: 'ATTACHMENT_SHARED',
        title: `Lead Stage: Shared ${docData.name} via ${autoShareChannel}`,
        description: `Dispatched ${docData.name} directly to ${leadName} on ${autoShareChannel}.`,
        metadata: {
          documentId: doc.id,
          fileName: docData.name,
          fileType: docData.fileType,
          shareChannel: autoShareChannel,
          sharedTo: leadPhone || leadEmail,
          category: docData.category,
          url: docData.url,
        },
        performedBy: 'Vartu Sales',
      });
    } else {
      log = {
        id: `act-${Date.now()}`,
        stage: 'Lead',
        entityId: leadId,
        entityNumber: leadNum,
        customerName: leadName,
        action: 'ATTACHMENT_UPLOADED',
        title: `Lead Stage: Uploaded ${docData.name}`,
        description: `Stored in Documents under category ${docData.category}.`,
        performedBy: 'Vartu Sales',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }

    return { doc, log };
  };

  const addQuotationAttachment = (
    quotationId: string,
    docData: {
      name: string;
      fileType: CrmDocument['fileType'];
      url: string;
      thumbnailUrl?: string;
      size: string;
      category: string;
      notes?: string;
      mimeType?: string;
    },
    autoShareChannel?: 'WhatsApp' | 'Email' | 'Direct Link'
  ) => {
    const targetQt = quotations.find((q) => q.id === quotationId);
    const custName = targetQt ? targetQt.customerName : 'Quotation Customer';
    const qtNum = targetQt ? targetQt.quotationNumber : undefined;
    const custPhone = targetQt ? targetQt.customerMobile : undefined;
    const custEmail = targetQt ? targetQt.customerEmail : undefined;

    const doc = addDocument({
      name: docData.name,
      fileType: docData.fileType,
      mimeType: docData.mimeType,
      url: docData.url,
      thumbnailUrl: docData.thumbnailUrl,
      size: docData.size,
      stage: 'Quotation',
      linkedEntityId: quotationId,
      linkedEntityNumber: qtNum,
      linkedCustomerName: custName,
      customerMobile: custPhone,
      customerEmail: custEmail,
      category: docData.category,
      notes: docData.notes,
      uploadedBy: 'Design Team',
      sharedChannels: autoShareChannel ? [autoShareChannel] : [],
      lastSharedAt: autoShareChannel ? new Date().toISOString().replace('T', ' ').substring(0, 16) : undefined,
    });

    let log: ActivityLog;
    if (autoShareChannel) {
      log = addActivityLog({
        stage: 'Quotation',
        entityId: quotationId,
        entityNumber: qtNum,
        customerName: custName,
        action: 'ATTACHMENT_SHARED',
        title: `Quotation Stage: Shared ${docData.name} via ${autoShareChannel}`,
        description: `Sent ${docData.name} along with quotation ${qtNum || ''} to ${custName}.`,
        metadata: {
          documentId: doc.id,
          fileName: docData.name,
          fileType: docData.fileType,
          shareChannel: autoShareChannel,
          sharedTo: custPhone || custEmail,
          category: docData.category,
          url: docData.url,
        },
        performedBy: 'Sales Team',
      });
    } else {
      log = {
        id: `act-${Date.now()}`,
        stage: 'Quotation',
        entityId: quotationId,
        entityNumber: qtNum,
        customerName: custName,
        action: 'ATTACHMENT_UPLOADED',
        title: `Quotation Stage: Attached ${docData.name}`,
        description: `Attached to ${qtNum || 'quotation'} under ${docData.category}.`,
        performedBy: 'Design Team',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }

    return { doc, log };
  };

  return (
    <CrmContext.Provider
      value={{
        settings,
        updateSettings,
        currentRole,
        setCurrentRole,
        leads,
        addLead,
        updateLead,
        deleteLead,
        customers,
        addCustomer,
        updateCustomer,
        checkDuplicateCustomer,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        quotations,
        addQuotation,
        updateQuotation,
        convertQuotationToOrder,
        orders,
        addOrder,
        updateOrder,
        updateOrderStatus,
        production,
        updateProductionRecord,
        inventory,
        updateInventoryStock,
        addInventoryItem,
        payments,
        addPayment,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        generateInvoiceForOrder,
        dispatches,
        updateDispatch,
        followUps,
        addFollowUp,
        completeFollowUp,
        documents,
        addDocument,
        deleteDocument,
        shareDocument,
        addLeadAttachment,
        addQuotationAttachment,
        activityLogs,
        addActivityLog,
        activeTab,
        setActiveTab,
        selectedCustomerId,
        setSelectedCustomerId,
        selectedQuotationId,
        setSelectedQuotationId,
        selectedOrderId,
        setSelectedOrderId,
        quickAction,
        setQuickAction,
        dbConnected,
        dbSource,
        dbInfo,
        syncWithSqlServer,
        isSyncing,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) throw new Error('useCrm must be used within a CrmProvider');
  return context;
};
