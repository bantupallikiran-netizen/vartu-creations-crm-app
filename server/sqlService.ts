import sql from 'mssql';
import { getDbPool, testDbConnection } from './db.ts';

// Helper to sanitize undefined/null values
function val(v: any, fallback: any = null) {
  return v === undefined ? fallback : v;
}

/**
 * Initializes tables in SQL Server if they do not exist.
 */
export async function initializeTables(): Promise<{ success: boolean; message: string }> {
  try {
    const pool = await getDbPool();

    const ddl = `
    IF OBJECT_ID('dbo.Users', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Users (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            Email NVARCHAR(255) NOT NULL UNIQUE,
            FullName NVARCHAR(255) NOT NULL,
            PasswordHash NVARCHAR(255) NULL,
            Role NVARCHAR(50) NOT NULL,
            IsActive BIT NOT NULL DEFAULT 1,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.Customers', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Customers (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            CustomerNumber NVARCHAR(50) NOT NULL UNIQUE,
            Name NVARCHAR(255) NOT NULL,
            Mobile NVARCHAR(25) NOT NULL,
            Whatsapp NVARCHAR(25) NULL,
            Email NVARCHAR(255) NULL,
            Instagram NVARCHAR(100) NULL,
            Company NVARCHAR(255) NULL,
            Gstin NVARCHAR(20) NULL,
            Street NVARCHAR(500) NULL,
            City NVARCHAR(100) NULL,
            State NVARCHAR(100) NULL,
            Pincode NVARCHAR(20) NULL,
            CustomerType NVARCHAR(50) NOT NULL,
            CustomerSource NVARCHAR(50) NULL,
            FirstOrderDate DATE NULL,
            LastOrderDate DATE NULL,
            TotalOrders INT NOT NULL DEFAULT 0,
            TotalPurchaseValue DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            OutstandingAmount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            LifetimeValue DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            CustomerRating INT NOT NULL DEFAULT 5,
            Notes NVARCHAR(MAX) NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.Leads', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Leads (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            LeadNumber NVARCHAR(50) NOT NULL UNIQUE,
            Date DATE NOT NULL,
            CustomerName NVARCHAR(255) NOT NULL,
            Mobile NVARCHAR(25) NOT NULL,
            Whatsapp NVARCHAR(25) NULL,
            Email NVARCHAR(255) NULL,
            InstagramId NVARCHAR(100) NULL,
            CompanyName NVARCHAR(255) NULL,
            LeadSource NVARCHAR(50) NOT NULL,
            ProductInterest NVARCHAR(MAX) NULL,
            Quantity INT NOT NULL DEFAULT 1,
            CustomizationRequired BIT NOT NULL DEFAULT 0,
            CustomizationNotes NVARCHAR(MAX) NULL,
            ExpectedBudget DECIMAL(18, 2) NULL,
            ExpectedDeliveryDate DATE NULL,
            Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium',
            Status NVARCHAR(50) NOT NULL DEFAULT 'New',
            AssignedUser NVARCHAR(100) NULL,
            NextFollowUpDate DATE NULL,
            Remarks NVARCHAR(MAX) NULL,
            Tags NVARCHAR(MAX) NULL,
            ConvertedCustomerId NVARCHAR(50) NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.Products', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Products (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            Sku NVARCHAR(100) NOT NULL UNIQUE,
            Name NVARCHAR(255) NOT NULL,
            Category NVARCHAR(100) NOT NULL,
            Subcategory NVARCHAR(100) NULL,
            Description NVARCHAR(MAX) NULL,
            ImageUrl NVARCHAR(1000) NULL,
            SellingPrice DECIMAL(18, 2) NOT NULL,
            CostPrice DECIMAL(18, 2) NOT NULL,
            RawMaterialCost DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            LabourCost DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            PackagingCost DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            OtherCost DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            Moq INT NOT NULL DEFAULT 1,
            BulkPrice DECIMAL(18, 2) NULL,
            BulkMoq INT NOT NULL DEFAULT 20,
            WholesalePrice DECIMAL(18, 2) NULL,
            WholesaleMoq INT NOT NULL DEFAULT 50,
            CorporatePrice DECIMAL(18, 2) NULL,
            StockQuantity INT NOT NULL DEFAULT 0,
            MinStockLevel INT NOT NULL DEFAULT 5,
            ProductionTimeDays INT NOT NULL DEFAULT 2,
            CustomizationAvailable BIT NOT NULL DEFAULT 1,
            CustomizationCharge DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            Active BIT NOT NULL DEFAULT 1,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.Quotations', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Quotations (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            QuotationNumber NVARCHAR(50) NOT NULL UNIQUE,
            QuotationDate DATE NOT NULL,
            ValidUntil DATE NOT NULL,
            CustomerId NVARCHAR(50) NULL,
            CustomerName NVARCHAR(255) NOT NULL,
            CustomerMobile NVARCHAR(25) NOT NULL,
            CustomerEmail NVARCHAR(255) NULL,
            CustomerAddress NVARCHAR(500) NULL,
            Subtotal DECIMAL(18, 2) NOT NULL,
            DiscountAmount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            PackagingCharge DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            ShippingCharge DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            GstRatePercent DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
            GstType NVARCHAR(20) NOT NULL DEFAULT 'CGST_SGST',
            GstAmount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            GrandTotal DECIMAL(18, 2) NOT NULL,
            AdvanceRequired DECIMAL(18, 2) NOT NULL,
            BalanceAmount DECIMAL(18, 2) NOT NULL,
            DeliveryTimeline NVARCHAR(255) NULL,
            TermsAndConditions NVARCHAR(MAX) NULL,
            Status NVARCHAR(50) NOT NULL DEFAULT 'Sent',
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.QuotationItems', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.QuotationItems (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            QuotationId NVARCHAR(50) NOT NULL,
            ProductId NVARCHAR(50) NULL,
            ProductName NVARCHAR(255) NOT NULL,
            Sku NVARCHAR(100) NULL,
            Quantity INT NOT NULL,
            UnitPrice DECIMAL(18, 2) NOT NULL,
            CustomizationNotes NVARCHAR(MAX) NULL,
            CustomizationCharge DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            ItemTotal DECIMAL(18, 2) NOT NULL
        );
    END;

    IF OBJECT_ID('dbo.Orders', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Orders (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            OrderNumber NVARCHAR(50) NOT NULL UNIQUE,
            CustomerId NVARCHAR(50) NOT NULL,
            CustomerName NVARCHAR(255) NOT NULL,
            CustomerMobile NVARCHAR(25) NOT NULL,
            CustomerEmail NVARCHAR(255) NULL,
            CustomerAddress NVARCHAR(500) NULL,
            QuotationId NVARCHAR(50) NULL,
            OrderDate DATE NOT NULL,
            RequiredDeliveryDate DATE NOT NULL,
            OrderType NVARCHAR(50) NOT NULL,
            Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium',
            TotalValue DECIMAL(18, 2) NOT NULL,
            AdvanceRequired DECIMAL(18, 2) NOT NULL,
            AdvanceReceived DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            BalanceAmount DECIMAL(18, 2) NOT NULL,
            PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending',
            ProductionStatus NVARCHAR(50) NOT NULL DEFAULT 'Production Pending',
            DispatchStatus NVARCHAR(50) NOT NULL DEFAULT 'Not Dispatched',
            OrderStatus NVARCHAR(50) NOT NULL DEFAULT 'Order Confirmed',
            Courier NVARCHAR(100) NULL,
            TrackingNumber NVARCHAR(100) NULL,
            Notes NVARCHAR(MAX) NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.OrderItems', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.OrderItems (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            OrderId NVARCHAR(50) NOT NULL,
            ProductId NVARCHAR(50) NULL,
            ProductName NVARCHAR(255) NOT NULL,
            Sku NVARCHAR(100) NULL,
            Quantity INT NOT NULL,
            UnitPrice DECIMAL(18, 2) NOT NULL,
            Total DECIMAL(18, 2) NOT NULL,
            CustomNameText NVARCHAR(255) NULL,
            CustomColor NVARCHAR(100) NULL,
            CustomDesign NVARCHAR(255) NULL,
            CustomSize NVARCHAR(100) NULL,
            CustomPhotoUrl NVARCHAR(1000) NULL,
            SpecialInstructions NVARCHAR(MAX) NULL,
            ApprovalStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending',
            ApprovalDate DATE NULL,
            Version INT NOT NULL DEFAULT 1
        );
    END;

    IF OBJECT_ID('dbo.Invoices', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Invoices (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            InvoiceNumber NVARCHAR(50) NOT NULL UNIQUE,
            OrderId NVARCHAR(50) NOT NULL,
            OrderNumber NVARCHAR(50) NOT NULL,
            CustomerId NVARCHAR(50) NOT NULL,
            CustomerName NVARCHAR(255) NOT NULL,
            CustomerMobile NVARCHAR(25) NULL,
            CustomerEmail NVARCHAR(255) NULL,
            CustomerGstin NVARCHAR(20) NULL,
            BillingAddress NVARCHAR(500) NOT NULL,
            InvoiceDate DATE NOT NULL,
            DueDate DATE NOT NULL,
            GstRatePercent DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
            GstType NVARCHAR(20) NOT NULL DEFAULT 'CGST_SGST',
            Subtotal DECIMAL(18, 2) NOT NULL,
            Cgst DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            Sgst DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            Igst DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            GrandTotal DECIMAL(18, 2) NOT NULL,
            AmountPaid DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            BalanceDue DECIMAL(18, 2) NOT NULL,
            Status NVARCHAR(50) NOT NULL DEFAULT 'Issued',
            Notes NVARCHAR(MAX) NULL,
            TermsAndConditions NVARCHAR(MAX) NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.Payments', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Payments (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            ReceiptNumber NVARCHAR(50) NOT NULL UNIQUE,
            OrderId NVARCHAR(50) NOT NULL,
            OrderNumber NVARCHAR(50) NOT NULL,
            CustomerId NVARCHAR(50) NOT NULL,
            CustomerName NVARCHAR(255) NOT NULL,
            Amount DECIMAL(18, 2) NOT NULL,
            PaymentDate DATE NOT NULL,
            Mode NVARCHAR(50) NOT NULL,
            TransactionRef NVARCHAR(100) NOT NULL,
            Status NVARCHAR(50) NOT NULL DEFAULT 'Completed',
            Notes NVARCHAR(MAX) NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.Production', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Production (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            OrderId NVARCHAR(50) NOT NULL,
            OrderNumber NVARCHAR(50) NOT NULL,
            ProductName NVARCHAR(255) NOT NULL,
            Sku NVARCHAR(100) NULL,
            RequiredQty INT NOT NULL,
            ProducedQty INT NOT NULL DEFAULT 0,
            RejectedQty INT NOT NULL DEFAULT 0,
            BalanceQty INT NOT NULL,
            StartDate DATE NULL,
            ExpectedCompletionDate DATE NOT NULL,
            ActualCompletionDate DATE NULL,
            Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
            Controller NVARCHAR(100) NOT NULL,
            Remarks NVARCHAR(MAX) NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.Inventory', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Inventory (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            Sku NVARCHAR(100) NOT NULL UNIQUE,
            Name NVARCHAR(255) NOT NULL,
            Type NVARCHAR(50) NOT NULL,
            Category NVARCHAR(100) NOT NULL,
            Unit NVARCHAR(50) NOT NULL,
            CurrentStock DECIMAL(18, 2) NOT NULL,
            MinStockLevel DECIMAL(18, 2) NOT NULL,
            ReorderLevel DECIMAL(18, 2) NOT NULL,
            UnitCost DECIMAL(18, 2) NOT NULL,
            Supplier NVARCHAR(255) NULL,
            LastRestocked DATE NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.InventoryTransactions', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.InventoryTransactions (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            InventoryId NVARCHAR(50) NOT NULL,
            TransactionType NVARCHAR(50) NOT NULL,
            QuantityChange DECIMAL(18, 2) NOT NULL,
            PreviousStock DECIMAL(18, 2) NOT NULL,
            NewStock DECIMAL(18, 2) NOT NULL,
            ReferenceOrderId NVARCHAR(50) NULL,
            ReferenceProductionId NVARCHAR(50) NULL,
            Remarks NVARCHAR(MAX) NULL,
            PerformedBy NVARCHAR(100) NOT NULL,
            Timestamp DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.Dispatches', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Dispatches (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            OrderId NVARCHAR(50) NOT NULL,
            OrderNumber NVARCHAR(50) NOT NULL,
            CustomerName NVARCHAR(255) NOT NULL,
            CustomerMobile NVARCHAR(25) NOT NULL,
            ShippingAddress NVARCHAR(500) NOT NULL,
            Courier NVARCHAR(100) NOT NULL,
            AwbTrackingNumber NVARCHAR(100) NOT NULL,
            DispatchDate DATE NOT NULL,
            ExpectedDelivery DATE NOT NULL,
            ActualDelivery DATE NULL,
            ShippingCharge DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
            Status NVARCHAR(50) NOT NULL DEFAULT 'Ready',
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.FollowUps', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.FollowUps (
            Id NVARCHAR(50) NOT NULL PRIMARY KEY,
            EntityType NVARCHAR(50) NOT NULL,
            EntityId NVARCHAR(50) NOT NULL,
            CustomerName NVARCHAR(255) NOT NULL,
            ContactNumber NVARCHAR(25) NOT NULL,
            ScheduledDate DATE NOT NULL,
            Title NVARCHAR(255) NOT NULL,
            Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium',
            Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
            Notes NVARCHAR(MAX) NULL,
            CompletedAt DATETIME2 NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID('dbo.CompanySettings', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.CompanySettings (
            Id INT NOT NULL PRIMARY KEY DEFAULT 1,
            SettingsJson NVARCHAR(MAX) NOT NULL,
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END;
    `;

    await pool.request().query(ddl);
    return { success: true, message: 'All tables verified/initialized in VartuCRM SQL Server' };
  } catch (err: any) {
    console.error('Failed to initialize tables:', err);
    return { success: false, message: err.message };
  }
}

// =====================================================================
// DATA ACCESS METHODS
// =====================================================================

// --- CUSTOMERS ---
export async function getCustomersSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, CustomerNumber as customerNumber, Name as name, Mobile as mobile,
           Whatsapp as whatsapp, Email as email, Instagram as instagram, Company as company,
           Gstin as gstin, Street, City, State, Pincode,
           CustomerType as customerType, CustomerSource as customerSource,
           CONVERT(VARCHAR(10), FirstOrderDate, 23) as firstOrderDate,
           CONVERT(VARCHAR(10), LastOrderDate, 23) as lastOrderDate,
           TotalOrders as totalOrders, TotalPurchaseValue as totalPurchaseValue,
           OutstandingAmount as outstandingAmount, LifetimeValue as lifetimeValue,
           CustomerRating as customerRating, Notes as notes,
           CONVERT(VARCHAR(10), CreatedAt, 23) as createdAt
    FROM dbo.Customers
    ORDER BY CreatedAt DESC
  `);
  return res.recordset.map((r: any) => ({
    ...r,
    address: {
      street: r.Street || '',
      city: r.City || '',
      state: r.State || '',
      pincode: r.Pincode || '',
    },
  }));
}

export async function insertCustomerSql(cust: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), cust.id);
  req.input('CustomerNumber', sql.NVarChar(50), cust.customerNumber);
  req.input('Name', sql.NVarChar(255), cust.name);
  req.input('Mobile', sql.NVarChar(25), cust.mobile);
  req.input('Whatsapp', sql.NVarChar(25), val(cust.whatsapp, cust.mobile));
  req.input('Email', sql.NVarChar(255), val(cust.email));
  req.input('Instagram', sql.NVarChar(100), val(cust.instagram));
  req.input('Company', sql.NVarChar(255), val(cust.company));
  req.input('Gstin', sql.NVarChar(20), val(cust.gstin));
  req.input('Street', sql.NVarChar(500), val(cust.address?.street));
  req.input('City', sql.NVarChar(100), val(cust.address?.city));
  req.input('State', sql.NVarChar(100), val(cust.address?.state));
  req.input('Pincode', sql.NVarChar(20), val(cust.address?.pincode));
  req.input('CustomerType', sql.NVarChar(50), cust.customerType || 'Retail');
  req.input('CustomerSource', sql.NVarChar(50), val(cust.customerSource));
  req.input('TotalOrders', sql.Int, cust.totalOrders || 0);
  req.input('TotalPurchaseValue', sql.Decimal(18, 2), cust.totalPurchaseValue || 0);
  req.input('OutstandingAmount', sql.Decimal(18, 2), cust.outstandingAmount || 0);
  req.input('LifetimeValue', sql.Decimal(18, 2), cust.lifetimeValue || cust.totalPurchaseValue || 0);
  req.input('CustomerRating', sql.Int, cust.customerRating || 5);
  req.input('Notes', sql.NVarChar(sql.MAX), val(cust.notes));

  await req.query(`
    INSERT INTO dbo.Customers (
      Id, CustomerNumber, Name, Mobile, Whatsapp, Email, Instagram, Company, Gstin,
      Street, City, State, Pincode, CustomerType, CustomerSource, TotalOrders,
      TotalPurchaseValue, OutstandingAmount, LifetimeValue, CustomerRating, Notes
    ) VALUES (
      @Id, @CustomerNumber, @Name, @Mobile, @Whatsapp, @Email, @Instagram, @Company, @Gstin,
      @Street, @City, @State, @Pincode, @CustomerType, @CustomerSource, @TotalOrders,
      @TotalPurchaseValue, @OutstandingAmount, @LifetimeValue, @CustomerRating, @Notes
    )
  `);
  return cust;
}

export async function updateCustomerSql(id: string, updates: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), id);

  const setClauses: string[] = ['UpdatedAt = SYSUTCDATETIME()'];
  if (updates.name !== undefined) { req.input('Name', sql.NVarChar(255), updates.name); setClauses.push('Name = @Name'); }
  if (updates.mobile !== undefined) { req.input('Mobile', sql.NVarChar(25), updates.mobile); setClauses.push('Mobile = @Mobile'); }
  if (updates.whatsapp !== undefined) { req.input('Whatsapp', sql.NVarChar(25), updates.whatsapp); setClauses.push('Whatsapp = @Whatsapp'); }
  if (updates.email !== undefined) { req.input('Email', sql.NVarChar(255), updates.email); setClauses.push('Email = @Email'); }
  if (updates.totalOrders !== undefined) { req.input('TotalOrders', sql.Int, updates.totalOrders); setClauses.push('TotalOrders = @TotalOrders'); }
  if (updates.totalPurchaseValue !== undefined) { req.input('TotalPurchaseValue', sql.Decimal(18, 2), updates.totalPurchaseValue); setClauses.push('TotalPurchaseValue = @TotalPurchaseValue'); setClauses.push('LifetimeValue = @TotalPurchaseValue'); }
  if (updates.outstandingAmount !== undefined) { req.input('OutstandingAmount', sql.Decimal(18, 2), updates.outstandingAmount); setClauses.push('OutstandingAmount = @OutstandingAmount'); }
  if (updates.notes !== undefined) { req.input('Notes', sql.NVarChar(sql.MAX), updates.notes); setClauses.push('Notes = @Notes'); }

  await req.query(`UPDATE dbo.Customers SET ${setClauses.join(', ')} WHERE Id = @Id`);
}

// --- LEADS ---
export async function getLeadsSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, LeadNumber as leadNumber, CONVERT(VARCHAR(10), Date, 23) as date,
           CustomerName as customerName, Mobile as mobile, Whatsapp as whatsapp,
           Email as email, InstagramId as instagramId, CompanyName as companyName,
           LeadSource as leadSource, ProductInterest as productInterestJson,
           Quantity as quantity, CustomizationRequired as customizationRequired,
           CustomizationNotes as customizationNotes, ExpectedBudget as expectedBudget,
           CONVERT(VARCHAR(10), ExpectedDeliveryDate, 23) as expectedDeliveryDate,
           Priority as priority, Status as status, AssignedUser as assignedUser,
           CONVERT(VARCHAR(10), NextFollowUpDate, 23) as nextFollowUpDate,
           Remarks as remarks, Tags as tagsJson,
           CONVERT(VARCHAR(10), CreatedAt, 23) as createdAt,
           CONVERT(VARCHAR(10), UpdatedAt, 23) as updatedAt
    FROM dbo.Leads
    ORDER BY CreatedAt DESC
  `);
  return res.recordset.map((r: any) => ({
    ...r,
    customizationRequired: Boolean(r.customizationRequired),
    productInterest: r.productInterestJson ? JSON.parse(r.productInterestJson) : [],
    tags: r.tagsJson ? JSON.parse(r.tagsJson) : [],
  }));
}

export async function insertLeadSql(lead: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), lead.id);
  req.input('LeadNumber', sql.NVarChar(50), lead.leadNumber);
  req.input('Date', sql.Date, lead.date || new Date().toISOString().split('T')[0]);
  req.input('CustomerName', sql.NVarChar(255), lead.customerName);
  req.input('Mobile', sql.NVarChar(25), lead.mobile);
  req.input('Whatsapp', sql.NVarChar(25), val(lead.whatsapp, lead.mobile));
  req.input('Email', sql.NVarChar(255), val(lead.email));
  req.input('InstagramId', sql.NVarChar(100), val(lead.instagramId));
  req.input('CompanyName', sql.NVarChar(255), val(lead.companyName));
  req.input('LeadSource', sql.NVarChar(50), lead.leadSource || 'Other');
  req.input('ProductInterest', sql.NVarChar(sql.MAX), JSON.stringify(lead.productInterest || []));
  req.input('Quantity', sql.Int, lead.quantity || 1);
  req.input('CustomizationRequired', sql.Bit, lead.customizationRequired ? 1 : 0);
  req.input('CustomizationNotes', sql.NVarChar(sql.MAX), val(lead.customizationNotes));
  req.input('ExpectedBudget', sql.Decimal(18, 2), val(lead.expectedBudget));
  req.input('ExpectedDeliveryDate', sql.Date, val(lead.expectedDeliveryDate));
  req.input('Priority', sql.NVarChar(20), lead.priority || 'Medium');
  req.input('Status', sql.NVarChar(50), lead.status || 'New');
  req.input('AssignedUser', sql.NVarChar(100), val(lead.assignedUser, 'Vartu Sales'));
  req.input('NextFollowUpDate', sql.Date, val(lead.nextFollowUpDate));
  req.input('Remarks', sql.NVarChar(sql.MAX), val(lead.remarks));
  req.input('Tags', sql.NVarChar(sql.MAX), JSON.stringify(lead.tags || []));

  await req.query(`
    INSERT INTO dbo.Leads (
      Id, LeadNumber, Date, CustomerName, Mobile, Whatsapp, Email, InstagramId,
      CompanyName, LeadSource, ProductInterest, Quantity, CustomizationRequired,
      CustomizationNotes, ExpectedBudget, ExpectedDeliveryDate, Priority, Status,
      AssignedUser, NextFollowUpDate, Remarks, Tags
    ) VALUES (
      @Id, @LeadNumber, @Date, @CustomerName, @Mobile, @Whatsapp, @Email, @InstagramId,
      @CompanyName, @LeadSource, @ProductInterest, @Quantity, @CustomizationRequired,
      @CustomizationNotes, @ExpectedBudget, @ExpectedDeliveryDate, @Priority, @Status,
      @AssignedUser, @NextFollowUpDate, @Remarks, @Tags
    )
  `);
  return lead;
}

export async function updateLeadSql(id: string, updates: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), id);

  const setClauses: string[] = ['UpdatedAt = SYSUTCDATETIME()'];
  if (updates.status !== undefined) { req.input('Status', sql.NVarChar(50), updates.status); setClauses.push('Status = @Status'); }
  if (updates.priority !== undefined) { req.input('Priority', sql.NVarChar(20), updates.priority); setClauses.push('Priority = @Priority'); }
  if (updates.remarks !== undefined) { req.input('Remarks', sql.NVarChar(sql.MAX), updates.remarks); setClauses.push('Remarks = @Remarks'); }
  if (updates.nextFollowUpDate !== undefined) { req.input('NextFollowUpDate', sql.Date, updates.nextFollowUpDate); setClauses.push('NextFollowUpDate = @NextFollowUpDate'); }

  await req.query(`UPDATE dbo.Leads SET ${setClauses.join(', ')} WHERE Id = @Id`);
}

// --- PRODUCTS ---
export async function getProductsSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, Sku as sku, Name as name, Category as category, Subcategory as subcategory,
           Description as description, ImageUrl as imageUrl, SellingPrice as sellingPrice,
           CostPrice as costPrice, RawMaterialCost, LabourCost, PackagingCost, OtherCost,
           Moq as moq, BulkPrice as bulkPrice, BulkMoq as bulkMoq, WholesalePrice as wholesalePrice,
           WholesaleMoq as wholesaleMoq, CorporatePrice as corporatePrice,
           StockQuantity as stockQuantity, MinStockLevel as minStockLevel,
           ProductionTimeDays as productionTimeDays, CustomizationAvailable as customizationAvailable,
           CustomizationCharge as customizationCharge, Active as active
    FROM dbo.Products
    ORDER BY Name ASC
  `);
  return res.recordset.map((r: any) => ({
    ...r,
    customizationAvailable: Boolean(r.customizationAvailable),
    active: Boolean(r.active),
    costing: {
      rawMaterial: r.RawMaterialCost || 0,
      labour: r.LabourCost || 0,
      packaging: r.PackagingCost || 0,
      other: r.OtherCost || 0,
    },
  }));
}

export async function insertProductSql(prod: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), prod.id);
  req.input('Sku', sql.NVarChar(100), prod.sku);
  req.input('Name', sql.NVarChar(255), prod.name);
  req.input('Category', sql.NVarChar(100), prod.category);
  req.input('Subcategory', sql.NVarChar(100), val(prod.subcategory));
  req.input('Description', sql.NVarChar(sql.MAX), val(prod.description, ''));
  req.input('ImageUrl', sql.NVarChar(1000), val(prod.imageUrl));
  req.input('SellingPrice', sql.Decimal(18, 2), prod.sellingPrice);
  req.input('CostPrice', sql.Decimal(18, 2), prod.costPrice);
  req.input('RawMaterialCost', sql.Decimal(18, 2), prod.costing?.rawMaterial || 0);
  req.input('LabourCost', sql.Decimal(18, 2), prod.costing?.labour || 0);
  req.input('PackagingCost', sql.Decimal(18, 2), prod.costing?.packaging || 0);
  req.input('OtherCost', sql.Decimal(18, 2), prod.costing?.other || 0);
  req.input('Moq', sql.Int, prod.moq || 1);
  req.input('BulkPrice', sql.Decimal(18, 2), val(prod.bulkPrice));
  req.input('BulkMoq', sql.Int, prod.bulkMoq || 20);
  req.input('WholesalePrice', sql.Decimal(18, 2), val(prod.wholesalePrice));
  req.input('WholesaleMoq', sql.Int, prod.wholesaleMoq || 50);
  req.input('CorporatePrice', sql.Decimal(18, 2), val(prod.corporatePrice));
  req.input('StockQuantity', sql.Int, prod.stockQuantity || 0);
  req.input('MinStockLevel', sql.Int, prod.minStockLevel || 5);
  req.input('ProductionTimeDays', sql.Int, prod.productionTimeDays || 2);
  req.input('CustomizationAvailable', sql.Bit, prod.customizationAvailable ? 1 : 0);
  req.input('CustomizationCharge', sql.Decimal(18, 2), prod.customizationCharge || 0);
  req.input('Active', sql.Bit, prod.active !== false ? 1 : 0);

  await req.query(`
    INSERT INTO dbo.Products (
      Id, Sku, Name, Category, Subcategory, Description, ImageUrl, SellingPrice, CostPrice,
      RawMaterialCost, LabourCost, PackagingCost, OtherCost, Moq, BulkPrice, BulkMoq,
      WholesalePrice, WholesaleMoq, CorporatePrice, StockQuantity, MinStockLevel,
      ProductionTimeDays, CustomizationAvailable, CustomizationCharge, Active
    ) VALUES (
      @Id, @Sku, @Name, @Category, @Subcategory, @Description, @ImageUrl, @SellingPrice, @CostPrice,
      @RawMaterialCost, @LabourCost, @PackagingCost, @OtherCost, @Moq, @BulkPrice, @BulkMoq,
      @WholesalePrice, @WholesaleMoq, @CorporatePrice, @StockQuantity, @MinStockLevel,
      @ProductionTimeDays, @CustomizationAvailable, @CustomizationCharge, @Active
    )
  `);
  return prod;
}

// --- QUOTATIONS ---
export async function getQuotationsSql() {
  const pool = await getDbPool();
  const qtsRes = await pool.request().query(`
    SELECT Id as id, QuotationNumber as quotationNumber,
           CONVERT(VARCHAR(10), QuotationDate, 23) as quotationDate,
           CONVERT(VARCHAR(10), ValidUntil, 23) as validUntil,
           CustomerId as customerId, CustomerName as customerName,
           CustomerMobile as customerMobile, CustomerEmail as customerEmail,
           CustomerAddress as customerAddress, Subtotal as subtotal,
           DiscountAmount as discountAmount, PackagingCharge as packagingCharge,
           ShippingCharge as shippingCharge, GstRatePercent as gstRatePercent,
           GstType as gstType, GstAmount as gstAmount, GrandTotal as grandTotal,
           AdvanceRequired as advanceRequired, BalanceAmount as balanceAmount,
           DeliveryTimeline as deliveryTimeline, TermsAndConditions as termsAndConditions,
           Status as status, CONVERT(VARCHAR(10), CreatedAt, 23) as createdAt
    FROM dbo.Quotations
    ORDER BY CreatedAt DESC
  `);

  const itemsRes = await pool.request().query(`
    SELECT Id as id, QuotationId as quotationId, ProductId as productId,
           ProductName as productName, Sku as sku, Quantity as quantity,
           UnitPrice as unitPrice, CustomizationNotes as customizationNotes,
           CustomizationCharge as customizationCharge, ItemTotal as itemTotal
    FROM dbo.QuotationItems
  `);

  const itemsByQt: Record<string, any[]> = {};
  for (const item of itemsRes.recordset) {
    if (!itemsByQt[item.quotationId]) itemsByQt[item.quotationId] = [];
    itemsByQt[item.quotationId].push(item);
  }

  return qtsRes.recordset.map((qt: any) => ({
    ...qt,
    items: itemsByQt[qt.id] || [],
  }));
}

export async function insertQuotationSql(qt: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), qt.id);
  req.input('QuotationNumber', sql.NVarChar(50), qt.quotationNumber);
  req.input('QuotationDate', sql.Date, qt.quotationDate);
  req.input('ValidUntil', sql.Date, qt.validUntil);
  req.input('CustomerId', sql.NVarChar(50), val(qt.customerId));
  req.input('CustomerName', sql.NVarChar(255), qt.customerName);
  req.input('CustomerMobile', sql.NVarChar(25), qt.customerMobile);
  req.input('CustomerEmail', sql.NVarChar(255), val(qt.customerEmail));
  req.input('CustomerAddress', sql.NVarChar(500), val(qt.customerAddress));
  req.input('Subtotal', sql.Decimal(18, 2), qt.subtotal);
  req.input('DiscountAmount', sql.Decimal(18, 2), qt.discountAmount || 0);
  req.input('PackagingCharge', sql.Decimal(18, 2), qt.packagingCharge || 0);
  req.input('ShippingCharge', sql.Decimal(18, 2), qt.shippingCharge || 0);
  req.input('GstRatePercent', sql.Decimal(5, 2), qt.gstRatePercent || 18);
  req.input('GstType', sql.NVarChar(20), qt.gstType || 'CGST_SGST');
  req.input('GstAmount', sql.Decimal(18, 2), qt.gstAmount || 0);
  req.input('GrandTotal', sql.Decimal(18, 2), qt.grandTotal);
  req.input('AdvanceRequired', sql.Decimal(18, 2), qt.advanceRequired);
  req.input('BalanceAmount', sql.Decimal(18, 2), qt.balanceAmount);
  req.input('DeliveryTimeline', sql.NVarChar(255), val(qt.deliveryTimeline));
  req.input('TermsAndConditions', sql.NVarChar(sql.MAX), val(qt.termsAndConditions));
  req.input('Status', sql.NVarChar(50), qt.status || 'Sent');

  await req.query(`
    INSERT INTO dbo.Quotations (
      Id, QuotationNumber, QuotationDate, ValidUntil, CustomerId, CustomerName,
      CustomerMobile, CustomerEmail, CustomerAddress, Subtotal, DiscountAmount,
      PackagingCharge, ShippingCharge, GstRatePercent, GstType, GstAmount,
      GrandTotal, AdvanceRequired, BalanceAmount, DeliveryTimeline, TermsAndConditions, Status
    ) VALUES (
      @Id, @QuotationNumber, @QuotationDate, @ValidUntil, @CustomerId, @CustomerName,
      @CustomerMobile, @CustomerEmail, @CustomerAddress, @Subtotal, @DiscountAmount,
      @PackagingCharge, @ShippingCharge, @GstRatePercent, @GstType, @GstAmount,
      @GrandTotal, @AdvanceRequired, @BalanceAmount, @DeliveryTimeline, @TermsAndConditions, @Status
    )
  `);

  if (qt.items && qt.items.length > 0) {
    for (let i = 0; i < qt.items.length; i++) {
      const it = qt.items[i];
      const itReq = pool.request();
      itReq.input('Id', sql.NVarChar(50), `qt-item-${qt.id}-${i}`);
      itReq.input('QuotationId', sql.NVarChar(50), qt.id);
      itReq.input('ProductId', sql.NVarChar(50), val(it.productId));
      itReq.input('ProductName', sql.NVarChar(255), it.productName);
      itReq.input('Sku', sql.NVarChar(100), val(it.sku));
      itReq.input('Quantity', sql.Int, it.quantity);
      itReq.input('UnitPrice', sql.Decimal(18, 2), it.unitPrice);
      itReq.input('CustomizationNotes', sql.NVarChar(sql.MAX), val(it.customizationNotes));
      itReq.input('CustomizationCharge', sql.Decimal(18, 2), it.customizationCharge || 0);
      itReq.input('ItemTotal', sql.Decimal(18, 2), it.itemTotal);

      await itReq.query(`
        INSERT INTO dbo.QuotationItems (
          Id, QuotationId, ProductId, ProductName, Sku, Quantity, UnitPrice,
          CustomizationNotes, CustomizationCharge, ItemTotal
        ) VALUES (
          @Id, @QuotationId, @ProductId, @ProductName, @Sku, @Quantity, @UnitPrice,
          @CustomizationNotes, @CustomizationCharge, @ItemTotal
        )
      `);
    }
  }

  return qt;
}

// --- ORDERS ---
export async function getOrdersSql() {
  const pool = await getDbPool();
  const ordsRes = await pool.request().query(`
    SELECT Id as id, OrderNumber as orderNumber, CustomerId as customerId,
           CustomerName as customerName, CustomerMobile as customerMobile,
           CustomerEmail as customerEmail, CustomerAddress as customerAddress,
           QuotationId as quotationId, CONVERT(VARCHAR(10), OrderDate, 23) as orderDate,
           CONVERT(VARCHAR(10), RequiredDeliveryDate, 23) as requiredDeliveryDate,
           OrderType as orderType, Priority as priority, TotalValue as totalValue,
           AdvanceRequired as advanceRequired, AdvanceReceived as advanceReceived,
           BalanceAmount as balanceAmount, PaymentStatus as paymentStatus,
           ProductionStatus as productionStatus, DispatchStatus as dispatchStatus,
           OrderStatus as orderStatus, Courier as courier, TrackingNumber as trackingNumber,
           Notes as notes, CONVERT(VARCHAR(10), CreatedAt, 23) as createdAt
    FROM dbo.Orders
    ORDER BY CreatedAt DESC
  `);

  const itemsRes = await pool.request().query(`
    SELECT Id as id, OrderId as orderId, ProductId as productId,
           ProductName as productName, Sku as sku, Quantity as quantity,
           UnitPrice as unitPrice, Total as total,
           CustomNameText, CustomColor, CustomDesign, CustomSize, CustomPhotoUrl,
           SpecialInstructions, ApprovalStatus, CONVERT(VARCHAR(10), ApprovalDate, 23) as ApprovalDate,
           Version
    FROM dbo.OrderItems
  `);

  const itemsByOrd: Record<string, any[]> = {};
  for (const item of itemsRes.recordset) {
    if (!itemsByOrd[item.orderId]) itemsByOrd[item.orderId] = [];
    itemsByOrd[item.orderId].push({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      customizationDetails: item.CustomNameText || item.SpecialInstructions ? {
        nameText: item.CustomNameText,
        color: item.CustomColor,
        design: item.CustomDesign,
        size: item.CustomSize,
        photoUrl: item.CustomPhotoUrl,
        specialInstructions: item.SpecialInstructions,
        approvalStatus: item.ApprovalStatus || 'Pending',
        approvalDate: item.ApprovalDate,
        version: item.Version || 1,
      } : undefined,
    });
  }

  return ordsRes.recordset.map((o: any) => ({
    ...o,
    items: itemsByOrd[o.id] || [],
  }));
}

export async function insertOrderSql(ord: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), ord.id);
  req.input('OrderNumber', sql.NVarChar(50), ord.orderNumber);
  req.input('CustomerId', sql.NVarChar(50), ord.customerId);
  req.input('CustomerName', sql.NVarChar(255), ord.customerName);
  req.input('CustomerMobile', sql.NVarChar(25), ord.customerMobile);
  req.input('CustomerEmail', sql.NVarChar(255), val(ord.customerEmail));
  req.input('CustomerAddress', sql.NVarChar(500), val(ord.customerAddress));
  req.input('QuotationId', sql.NVarChar(50), val(ord.quotationId));
  req.input('OrderDate', sql.Date, ord.orderDate);
  req.input('RequiredDeliveryDate', sql.Date, ord.requiredDeliveryDate);
  req.input('OrderType', sql.NVarChar(50), ord.orderType);
  req.input('Priority', sql.NVarChar(20), ord.priority || 'Medium');
  req.input('TotalValue', sql.Decimal(18, 2), ord.totalValue);
  req.input('AdvanceRequired', sql.Decimal(18, 2), ord.advanceRequired);
  req.input('AdvanceReceived', sql.Decimal(18, 2), ord.advanceReceived || 0);
  req.input('BalanceAmount', sql.Decimal(18, 2), ord.balanceAmount);
  req.input('PaymentStatus', sql.NVarChar(50), ord.paymentStatus || 'Pending');
  req.input('ProductionStatus', sql.NVarChar(50), ord.productionStatus || 'Production Pending');
  req.input('DispatchStatus', sql.NVarChar(50), ord.dispatchStatus || 'Not Dispatched');
  req.input('OrderStatus', sql.NVarChar(50), ord.orderStatus || 'Order Confirmed');
  req.input('Courier', sql.NVarChar(100), val(ord.courier));
  req.input('TrackingNumber', sql.NVarChar(100), val(ord.trackingNumber));
  req.input('Notes', sql.NVarChar(sql.MAX), val(ord.notes));

  await req.query(`
    INSERT INTO dbo.Orders (
      Id, OrderNumber, CustomerId, CustomerName, CustomerMobile, CustomerEmail,
      CustomerAddress, QuotationId, OrderDate, RequiredDeliveryDate, OrderType,
      Priority, TotalValue, AdvanceRequired, AdvanceReceived, BalanceAmount,
      PaymentStatus, ProductionStatus, DispatchStatus, OrderStatus, Courier,
      TrackingNumber, Notes
    ) VALUES (
      @Id, @OrderNumber, @CustomerId, @CustomerName, @CustomerMobile, @CustomerEmail,
      @CustomerAddress, @QuotationId, @OrderDate, @RequiredDeliveryDate, @OrderType,
      @Priority, @TotalValue, @AdvanceRequired, @AdvanceReceived, @BalanceAmount,
      @PaymentStatus, @ProductionStatus, @DispatchStatus, @OrderStatus, @Courier,
      @TrackingNumber, @Notes
    )
  `);

  if (ord.items && ord.items.length > 0) {
    for (let i = 0; i < ord.items.length; i++) {
      const it = ord.items[i];
      const itReq = pool.request();
      itReq.input('Id', sql.NVarChar(50), `ord-item-${ord.id}-${i}`);
      itReq.input('OrderId', sql.NVarChar(50), ord.id);
      itReq.input('ProductId', sql.NVarChar(50), val(it.productId));
      itReq.input('ProductName', sql.NVarChar(255), it.productName);
      itReq.input('Sku', sql.NVarChar(100), val(it.sku));
      itReq.input('Quantity', sql.Int, it.quantity);
      itReq.input('UnitPrice', sql.Decimal(18, 2), it.unitPrice);
      itReq.input('Total', sql.Decimal(18, 2), it.total);
      itReq.input('CustomNameText', sql.NVarChar(255), val(it.customizationDetails?.nameText));
      itReq.input('CustomColor', sql.NVarChar(100), val(it.customizationDetails?.color));
      itReq.input('CustomDesign', sql.NVarChar(255), val(it.customizationDetails?.design));
      itReq.input('CustomSize', sql.NVarChar(100), val(it.customizationDetails?.size));
      itReq.input('CustomPhotoUrl', sql.NVarChar(1000), val(it.customizationDetails?.photoUrl));
      itReq.input('SpecialInstructions', sql.NVarChar(sql.MAX), val(it.customizationDetails?.specialInstructions));
      itReq.input('ApprovalStatus', sql.NVarChar(50), it.customizationDetails?.approvalStatus || 'Pending');
      itReq.input('ApprovalDate', sql.Date, val(it.customizationDetails?.approvalDate));
      itReq.input('Version', sql.Int, it.customizationDetails?.version || 1);

      await itReq.query(`
        INSERT INTO dbo.OrderItems (
          Id, OrderId, ProductId, ProductName, Sku, Quantity, UnitPrice, Total,
          CustomNameText, CustomColor, CustomDesign, CustomSize, CustomPhotoUrl,
          SpecialInstructions, ApprovalStatus, ApprovalDate, Version
        ) VALUES (
          @Id, @OrderId, @ProductId, @ProductName, @Sku, @Quantity, @UnitPrice, @Total,
          @CustomNameText, @CustomColor, @CustomDesign, @CustomSize, @CustomPhotoUrl,
          @SpecialInstructions, @ApprovalStatus, @ApprovalDate, @Version
        )
      `);
    }
  }

  return ord;
}

export async function updateOrderSql(id: string, updates: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), id);

  const setClauses: string[] = ['UpdatedAt = SYSUTCDATETIME()'];
  if (updates.orderStatus !== undefined) { req.input('OrderStatus', sql.NVarChar(50), updates.orderStatus); setClauses.push('OrderStatus = @OrderStatus'); }
  if (updates.paymentStatus !== undefined) { req.input('PaymentStatus', sql.NVarChar(50), updates.paymentStatus); setClauses.push('PaymentStatus = @PaymentStatus'); }
  if (updates.productionStatus !== undefined) { req.input('ProductionStatus', sql.NVarChar(50), updates.productionStatus); setClauses.push('ProductionStatus = @ProductionStatus'); }
  if (updates.dispatchStatus !== undefined) { req.input('DispatchStatus', sql.NVarChar(50), updates.dispatchStatus); setClauses.push('DispatchStatus = @DispatchStatus'); }
  if (updates.advanceReceived !== undefined) { req.input('AdvanceReceived', sql.Decimal(18, 2), updates.advanceReceived); setClauses.push('AdvanceReceived = @AdvanceReceived'); }
  if (updates.balanceAmount !== undefined) { req.input('BalanceAmount', sql.Decimal(18, 2), updates.balanceAmount); setClauses.push('BalanceAmount = @BalanceAmount'); }
  if (updates.courier !== undefined) { req.input('Courier', sql.NVarChar(100), updates.courier); setClauses.push('Courier = @Courier'); }
  if (updates.trackingNumber !== undefined) { req.input('TrackingNumber', sql.NVarChar(100), updates.trackingNumber); setClauses.push('TrackingNumber = @TrackingNumber'); }

  await req.query(`UPDATE dbo.Orders SET ${setClauses.join(', ')} WHERE Id = @Id`);
}

// --- PRODUCTION ---
export async function getProductionSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, OrderId as orderId, OrderNumber as orderNumber,
           ProductName as productName, Sku as sku, RequiredQty as requiredQty,
           ProducedQty as producedQty, RejectedQty as rejectedQty, BalanceQty as balanceQty,
           CONVERT(VARCHAR(10), StartDate, 23) as startDate,
           CONVERT(VARCHAR(10), ExpectedCompletionDate, 23) as expectedCompletionDate,
           CONVERT(VARCHAR(10), ActualCompletionDate, 23) as actualCompletionDate,
           Status as status, Controller as controller, Remarks as remarks
    FROM dbo.Production
    ORDER BY CreatedAt DESC
  `);
  return res.recordset;
}

export async function insertProductionSql(rec: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), rec.id);
  req.input('OrderId', sql.NVarChar(50), rec.orderId);
  req.input('OrderNumber', sql.NVarChar(50), rec.orderNumber);
  req.input('ProductName', sql.NVarChar(255), rec.productName);
  req.input('Sku', sql.NVarChar(100), val(rec.sku));
  req.input('RequiredQty', sql.Int, rec.requiredQty);
  req.input('ProducedQty', sql.Int, rec.producedQty || 0);
  req.input('RejectedQty', sql.Int, rec.rejectedQty || 0);
  req.input('BalanceQty', sql.Int, rec.balanceQty);
  req.input('StartDate', sql.Date, val(rec.startDate));
  req.input('ExpectedCompletionDate', sql.Date, rec.expectedCompletionDate);
  req.input('ActualCompletionDate', sql.Date, val(rec.actualCompletionDate));
  req.input('Status', sql.NVarChar(50), rec.status || 'Pending');
  req.input('Controller', sql.NVarChar(100), rec.controller || 'Studio Lead');
  req.input('Remarks', sql.NVarChar(sql.MAX), val(rec.remarks));

  await req.query(`
    INSERT INTO dbo.Production (
      Id, OrderId, OrderNumber, ProductName, Sku, RequiredQty, ProducedQty,
      RejectedQty, BalanceQty, StartDate, ExpectedCompletionDate, ActualCompletionDate,
      Status, Controller, Remarks
    ) VALUES (
      @Id, @OrderId, @OrderNumber, @ProductName, @Sku, @RequiredQty, @ProducedQty,
      @RejectedQty, @BalanceQty, @StartDate, @ExpectedCompletionDate, @ActualCompletionDate,
      @Status, @Controller, @Remarks
    )
  `);
  return rec;
}

export async function updateProductionRecordSql(id: string, updates: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), id);

  const setClauses: string[] = ['UpdatedAt = SYSUTCDATETIME()'];
  if (updates.producedQty !== undefined) { req.input('ProducedQty', sql.Int, updates.producedQty); setClauses.push('ProducedQty = @ProducedQty'); }
  if (updates.rejectedQty !== undefined) { req.input('RejectedQty', sql.Int, updates.rejectedQty); setClauses.push('RejectedQty = @RejectedQty'); }
  if (updates.balanceQty !== undefined) { req.input('BalanceQty', sql.Int, updates.balanceQty); setClauses.push('BalanceQty = @BalanceQty'); }
  if (updates.status !== undefined) { req.input('Status', sql.NVarChar(50), updates.status); setClauses.push('Status = @Status'); }
  if (updates.remarks !== undefined) { req.input('Remarks', sql.NVarChar(sql.MAX), updates.remarks); setClauses.push('Remarks = @Remarks'); }

  await req.query(`UPDATE dbo.Production SET ${setClauses.join(', ')} WHERE Id = @Id`);
}

// --- INVENTORY ---
export async function getInventorySql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, Sku as sku, Name as name, Type as type, Category as category,
           Unit as unit, CurrentStock as currentStock, MinStockLevel as minStockLevel,
           ReorderLevel as reorderLevel, UnitCost as unitCost, Supplier as supplier,
           CONVERT(VARCHAR(10), LastRestocked, 23) as lastRestocked
    FROM dbo.Inventory
    ORDER BY Name ASC
  `);
  return res.recordset;
}

export async function insertInventorySql(item: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), item.id);
  req.input('Sku', sql.NVarChar(100), item.sku);
  req.input('Name', sql.NVarChar(255), item.name);
  req.input('Type', sql.NVarChar(50), item.type);
  req.input('Category', sql.NVarChar(100), item.category);
  req.input('Unit', sql.NVarChar(50), item.unit);
  req.input('CurrentStock', sql.Decimal(18, 2), item.currentStock);
  req.input('MinStockLevel', sql.Decimal(18, 2), item.minStockLevel);
  req.input('ReorderLevel', sql.Decimal(18, 2), item.reorderLevel);
  req.input('UnitCost', sql.Decimal(18, 2), item.unitCost);
  req.input('Supplier', sql.NVarChar(255), val(item.supplier));
  req.input('LastRestocked', sql.Date, val(item.lastRestocked));

  await req.query(`
    INSERT INTO dbo.Inventory (
      Id, Sku, Name, Type, Category, Unit, CurrentStock, MinStockLevel,
      ReorderLevel, UnitCost, Supplier, LastRestocked
    ) VALUES (
      @Id, @Sku, @Name, @Type, @Category, @Unit, @CurrentStock, @MinStockLevel,
      @ReorderLevel, @UnitCost, @Supplier, @LastRestocked
    )
  `);
  return item;
}

export async function updateInventoryStockSql(id: string, newStock: number) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), id);
  req.input('CurrentStock', sql.Decimal(18, 2), newStock);
  await req.query(`UPDATE dbo.Inventory SET CurrentStock = @CurrentStock, UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id`);
}

// --- PAYMENTS ---
export async function getPaymentsSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, ReceiptNumber as receiptNumber, OrderId as orderId,
           OrderNumber as orderNumber, CustomerId as customerId,
           CustomerName as customerName, Amount as amount,
           CONVERT(VARCHAR(10), PaymentDate, 23) as paymentDate,
           Mode as mode, TransactionRef as transactionRef,
           Status as status, Notes as notes
    FROM dbo.Payments
    ORDER BY CreatedAt DESC
  `);
  return res.recordset;
}

export async function insertPaymentSql(payment: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), payment.id);
  req.input('ReceiptNumber', sql.NVarChar(50), payment.receiptNumber);
  req.input('OrderId', sql.NVarChar(50), payment.orderId);
  req.input('OrderNumber', sql.NVarChar(50), payment.orderNumber);
  req.input('CustomerId', sql.NVarChar(50), payment.customerId);
  req.input('CustomerName', sql.NVarChar(255), payment.customerName);
  req.input('Amount', sql.Decimal(18, 2), payment.amount);
  req.input('PaymentDate', sql.Date, payment.paymentDate);
  req.input('Mode', sql.NVarChar(50), payment.mode);
  req.input('TransactionRef', sql.NVarChar(100), payment.transactionRef);
  req.input('Status', sql.NVarChar(50), payment.status || 'Completed');
  req.input('Notes', sql.NVarChar(sql.MAX), val(payment.notes));

  await req.query(`
    INSERT INTO dbo.Payments (
      Id, ReceiptNumber, OrderId, OrderNumber, CustomerId, CustomerName,
      Amount, PaymentDate, Mode, TransactionRef, Status, Notes
    ) VALUES (
      @Id, @ReceiptNumber, @OrderId, @OrderNumber, @CustomerId, @CustomerName,
      @Amount, @PaymentDate, @Mode, @TransactionRef, @Status, @Notes
    )
  `);
  return payment;
}

// --- INVOICES ---
export async function getInvoicesSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, InvoiceNumber as invoiceNumber, OrderId as orderId,
           OrderNumber as orderNumber, CustomerId as customerId,
           CustomerName as customerName, CustomerMobile as customerMobile,
           CustomerEmail as customerEmail, CustomerGstin as customerGstin,
           BillingAddress as billingAddress,
           CONVERT(VARCHAR(10), InvoiceDate, 23) as invoiceDate,
           CONVERT(VARCHAR(10), DueDate, 23) as dueDate,
           GstRatePercent as gstRatePercent, GstType as gstType,
           Subtotal as subtotal, Cgst as cgst, Sgst as sgst, Igst as igst,
           GrandTotal as grandTotal, AmountPaid as amountPaid,
           BalanceDue as balanceDue, Status as status, Notes as notes,
           TermsAndConditions as termsAndConditions
    FROM dbo.Invoices
    ORDER BY CreatedAt DESC
  `);
  return res.recordset;
}

export async function insertInvoiceSql(inv: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), inv.id);
  req.input('InvoiceNumber', sql.NVarChar(50), inv.invoiceNumber);
  req.input('OrderId', sql.NVarChar(50), inv.orderId);
  req.input('OrderNumber', sql.NVarChar(50), inv.orderNumber);
  req.input('CustomerId', sql.NVarChar(50), inv.customerId);
  req.input('CustomerName', sql.NVarChar(255), inv.customerName);
  req.input('CustomerMobile', sql.NVarChar(25), val(inv.customerMobile));
  req.input('CustomerEmail', sql.NVarChar(255), val(inv.customerEmail));
  req.input('CustomerGstin', sql.NVarChar(20), val(inv.customerGstin));
  req.input('BillingAddress', sql.NVarChar(500), inv.billingAddress);
  req.input('InvoiceDate', sql.Date, inv.invoiceDate);
  req.input('DueDate', sql.Date, inv.dueDate);
  req.input('GstRatePercent', sql.Decimal(5, 2), inv.gstRatePercent || 18);
  req.input('GstType', sql.NVarChar(20), inv.gstType || 'CGST_SGST');
  req.input('Subtotal', sql.Decimal(18, 2), inv.subtotal);
  req.input('Cgst', sql.Decimal(18, 2), inv.cgst || 0);
  req.input('Sgst', sql.Decimal(18, 2), inv.sgst || 0);
  req.input('Igst', sql.Decimal(18, 2), inv.igst || 0);
  req.input('GrandTotal', sql.Decimal(18, 2), inv.grandTotal);
  req.input('AmountPaid', sql.Decimal(18, 2), inv.amountPaid || 0);
  req.input('BalanceDue', sql.Decimal(18, 2), inv.balanceDue);
  req.input('Status', sql.NVarChar(50), inv.status || 'Issued');
  req.input('Notes', sql.NVarChar(sql.MAX), val(inv.notes));
  req.input('TermsAndConditions', sql.NVarChar(sql.MAX), val(inv.termsAndConditions));

  await req.query(`
    INSERT INTO dbo.Invoices (
      Id, InvoiceNumber, OrderId, OrderNumber, CustomerId, CustomerName,
      CustomerMobile, CustomerEmail, CustomerGstin, BillingAddress, InvoiceDate,
      DueDate, GstRatePercent, GstType, Subtotal, Cgst, Sgst, Igst, GrandTotal,
      AmountPaid, BalanceDue, Status, Notes, TermsAndConditions
    ) VALUES (
      @Id, @InvoiceNumber, @OrderId, @OrderNumber, @CustomerId, @CustomerName,
      @CustomerMobile, @CustomerEmail, @CustomerGstin, @BillingAddress, @InvoiceDate,
      @DueDate, @GstRatePercent, @GstType, @Subtotal, @Cgst, @Sgst, @Igst, @GrandTotal,
      @AmountPaid, @BalanceDue, @Status, @Notes, @TermsAndConditions
    )
  `);
  return inv;
}

export async function updateInvoiceSql(id: string, updates: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), id);

  const setClauses: string[] = ['UpdatedAt = SYSUTCDATETIME()'];
  if (updates.status !== undefined) { req.input('Status', sql.NVarChar(50), updates.status); setClauses.push('Status = @Status'); }
  if (updates.amountPaid !== undefined) { req.input('AmountPaid', sql.Decimal(18, 2), updates.amountPaid); setClauses.push('AmountPaid = @AmountPaid'); }
  if (updates.balanceDue !== undefined) { req.input('BalanceDue', sql.Decimal(18, 2), updates.balanceDue); setClauses.push('BalanceDue = @BalanceDue'); }

  await req.query(`UPDATE dbo.Invoices SET ${setClauses.join(', ')} WHERE Id = @Id`);
}

// --- DISPATCHES ---
export async function getDispatchesSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, OrderId as orderId, OrderNumber as orderNumber,
           CustomerName as customerName, CustomerMobile as customerMobile,
           ShippingAddress as shippingAddress, Courier as courier,
           AwbTrackingNumber as awbTrackingNumber,
           CONVERT(VARCHAR(10), DispatchDate, 23) as dispatchDate,
           CONVERT(VARCHAR(10), ExpectedDelivery, 23) as expectedDelivery,
           CONVERT(VARCHAR(10), ActualDelivery, 23) as actualDelivery,
           ShippingCharge as shippingCharge, Status as status
    FROM dbo.Dispatches
    ORDER BY CreatedAt DESC
  `);
  return res.recordset;
}

export async function insertDispatchSql(disp: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), disp.id);
  req.input('OrderId', sql.NVarChar(50), disp.orderId);
  req.input('OrderNumber', sql.NVarChar(50), disp.orderNumber);
  req.input('CustomerName', sql.NVarChar(255), disp.customerName);
  req.input('CustomerMobile', sql.NVarChar(25), disp.customerMobile);
  req.input('ShippingAddress', sql.NVarChar(500), disp.shippingAddress);
  req.input('Courier', sql.NVarChar(100), disp.courier);
  req.input('AwbTrackingNumber', sql.NVarChar(100), disp.awbTrackingNumber);
  req.input('DispatchDate', sql.Date, disp.dispatchDate);
  req.input('ExpectedDelivery', sql.Date, disp.expectedDelivery);
  req.input('ActualDelivery', sql.Date, val(disp.actualDelivery));
  req.input('ShippingCharge', sql.Decimal(18, 2), disp.shippingCharge || 0);
  req.input('Status', sql.NVarChar(50), disp.status || 'Ready');

  await req.query(`
    INSERT INTO dbo.Dispatches (
      Id, OrderId, OrderNumber, CustomerName, CustomerMobile, ShippingAddress,
      Courier, AwbTrackingNumber, DispatchDate, ExpectedDelivery, ActualDelivery,
      ShippingCharge, Status
    ) VALUES (
      @Id, @OrderId, @OrderNumber, @CustomerName, @CustomerMobile, @ShippingAddress,
      @Courier, @AwbTrackingNumber, @DispatchDate, @ExpectedDelivery, @ActualDelivery,
      @ShippingCharge, @Status
    )
  `);
  return disp;
}

// --- FOLLOW-UPS ---
export async function getFollowUpsSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, EntityType as entityType, EntityId as entityId,
           CustomerName as customerName, ContactNumber as contactNumber,
           CONVERT(VARCHAR(10), ScheduledDate, 23) as scheduledDate,
           Title as title, Priority as priority, Status as status, Notes as notes,
           CONVERT(VARCHAR(19), CompletedAt, 120) as completedAt
    FROM dbo.FollowUps
    ORDER BY ScheduledDate ASC
  `);
  return res.recordset;
}

export async function insertFollowUpSql(flw: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), flw.id);
  req.input('EntityType', sql.NVarChar(50), flw.entityType);
  req.input('EntityId', sql.NVarChar(50), flw.entityId);
  req.input('CustomerName', sql.NVarChar(255), flw.customerName);
  req.input('ContactNumber', sql.NVarChar(25), flw.contactNumber);
  req.input('ScheduledDate', sql.Date, flw.scheduledDate);
  req.input('Title', sql.NVarChar(255), flw.title);
  req.input('Priority', sql.NVarChar(20), flw.priority || 'Medium');
  req.input('Status', sql.NVarChar(50), flw.status || 'Pending');
  req.input('Notes', sql.NVarChar(sql.MAX), val(flw.notes));

  await req.query(`
    INSERT INTO dbo.FollowUps (
      Id, EntityType, EntityId, CustomerName, ContactNumber, ScheduledDate,
      Title, Priority, Status, Notes
    ) VALUES (
      @Id, @EntityType, @EntityId, @CustomerName, @ContactNumber, @ScheduledDate,
      @Title, @Priority, @Status, @Notes
    )
  `);
  return flw;
}

export async function completeFollowUpSql(id: string) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), id);
  await req.query(`
    UPDATE dbo.FollowUps
    SET Status = 'Completed', CompletedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @Id
  `);
}

// --- USERS ---
export async function getUsersSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`
    SELECT Id as id, Email as email, FullName as fullName, Role as role,
           IsActive as isActive, CONVERT(VARCHAR(10), CreatedAt, 23) as createdAt
    FROM dbo.Users
    ORDER BY FullName ASC
  `);
  return res.recordset.map((u: any) => ({ ...u, isActive: Boolean(u.isActive) }));
}

export async function insertUserSql(user: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('Id', sql.NVarChar(50), user.id);
  req.input('Email', sql.NVarChar(255), user.email);
  req.input('FullName', sql.NVarChar(255), user.fullName);
  req.input('Role', sql.NVarChar(50), user.role);
  req.input('IsActive', sql.Bit, user.isActive !== false ? 1 : 0);

  await req.query(`
    INSERT INTO dbo.Users (Id, Email, FullName, Role, IsActive)
    VALUES (@Id, @Email, @FullName, @Role, @IsActive)
  `);
  return user;
}

// --- SETTINGS ---
export async function getSettingsSql() {
  const pool = await getDbPool();
  const res = await pool.request().query(`SELECT SettingsJson FROM dbo.CompanySettings WHERE Id = 1`);
  if (res.recordset.length > 0 && res.recordset[0].SettingsJson) {
    return JSON.parse(res.recordset[0].SettingsJson);
  }
  return null;
}

export async function saveSettingsSql(settings: any) {
  const pool = await getDbPool();
  const req = pool.request();
  req.input('SettingsJson', sql.NVarChar(sql.MAX), JSON.stringify(settings));
  await req.query(`
    IF EXISTS (SELECT 1 FROM dbo.CompanySettings WHERE Id = 1)
      UPDATE dbo.CompanySettings SET SettingsJson = @SettingsJson, UpdatedAt = SYSUTCDATETIME() WHERE Id = 1
    ELSE
      INSERT INTO dbo.CompanySettings (Id, SettingsJson) VALUES (1, @SettingsJson)
  `);
  return settings;
}
