-- =====================================================================================
-- Database: VartuCRM
-- Server: DESKTOP-BQDO1QT
-- Engine: Microsoft SQL Server (T-SQL)
-- Application: Vartu Creations — AI-Powered CRM & Order Management System
-- Source of Truth: SQL Server via Node.js (mssql) API
-- =====================================================================================

-- 1. Ensure Database exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'VartuCRM')
BEGIN
    CREATE DATABASE VartuCRM;
END
GO

USE VartuCRM;
GO

-- =====================================================================================
-- TABLE 1: Users
-- System users, artisans, and role-based permissions
-- =====================================================================================
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        FullName NVARCHAR(255) NOT NULL,
        PasswordHash NVARCHAR(255) NULL,
        Role NVARCHAR(50) NOT NULL CHECK (Role IN ('Owner/Admin', 'Sales/Order Manager', 'Production', 'Accounts', 'Viewer')),
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Users_Role ON dbo.Users(Role);
END
GO

-- =====================================================================================
-- TABLE 2: Customers
-- Retail, corporate, wholesale, and repeat craft clients
-- =====================================================================================
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
        CustomerType NVARCHAR(50) NOT NULL CHECK (CustomerType IN ('Retail', 'Corporate', 'Wholesale', 'Reseller', 'Event', 'Gift Buyer', 'Repeat Customer')),
        CustomerSource NVARCHAR(50) NULL,
        FirstOrderDate DATE NULL,
        LastOrderDate DATE NULL,
        TotalOrders INT NOT NULL DEFAULT 0,
        TotalPurchaseValue DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        OutstandingAmount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        LifetimeValue DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        CustomerRating INT NOT NULL DEFAULT 5 CHECK (CustomerRating BETWEEN 1 AND 5),
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Customers_Mobile ON dbo.Customers(Mobile);
    CREATE NONCLUSTERED INDEX IX_Customers_Whatsapp ON dbo.Customers(Whatsapp);
    CREATE NONCLUSTERED INDEX IX_Customers_Email ON dbo.Customers(Email);
    CREATE NONCLUSTERED INDEX IX_Customers_CustomerType ON dbo.Customers(CustomerType);
END
GO

-- =====================================================================================
-- TABLE 3: Leads
-- Inquiries from Instagram, WhatsApp, Exhibitions, Meesho, etc.
-- =====================================================================================
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
        ProductInterest NVARCHAR(MAX) NULL, -- JSON array of product names
        Quantity INT NOT NULL DEFAULT 1,
        CustomizationRequired BIT NOT NULL DEFAULT 0,
        CustomizationNotes NVARCHAR(MAX) NULL,
        ExpectedBudget DECIMAL(18, 2) NULL,
        ExpectedDeliveryDate DATE NULL,
        Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (Priority IN ('Low', 'Medium', 'High', 'Urgent')),
        Status NVARCHAR(50) NOT NULL DEFAULT 'New' CHECK (Status IN (
            'New', 'Contacted', 'Interested', 'Requirement Received', 
            'Quotation Required', 'Quotation Sent', 'Negotiation', 
            'Advance Pending', 'Order Confirmed', 'Not Interested', 'Lost', 'On Hold'
        )),
        AssignedUser NVARCHAR(100) NULL,
        NextFollowUpDate DATE NULL,
        Remarks NVARCHAR(MAX) NULL,
        Tags NVARCHAR(MAX) NULL, -- JSON array of tags
        ConvertedCustomerId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Customers(Id) ON DELETE SET NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Leads_Status ON dbo.Leads(Status);
    CREATE NONCLUSTERED INDEX IX_Leads_NextFollowUpDate ON dbo.Leads(NextFollowUpDate);
    CREATE NONCLUSTERED INDEX IX_Leads_Mobile ON dbo.Leads(Mobile);
END
GO

-- =====================================================================================
-- TABLE 4: Products
-- Artisan handcrafted catalogue (Resin, Candles, Concrete, Rakhis, Hampers)
-- =====================================================================================
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

    CREATE NONCLUSTERED INDEX IX_Products_Category ON dbo.Products(Category);
    CREATE NONCLUSTERED INDEX IX_Products_Active ON dbo.Products(Active);
END
GO

-- =====================================================================================
-- TABLE 5: Quotations
-- Multi-item quotations with GST, discounts, and terms
-- =====================================================================================
IF OBJECT_ID('dbo.Quotations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Quotations (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        QuotationNumber NVARCHAR(50) NOT NULL UNIQUE,
        QuotationDate DATE NOT NULL,
        ValidUntil DATE NOT NULL,
        CustomerId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Customers(Id) ON DELETE SET NULL,
        CustomerName NVARCHAR(255) NOT NULL,
        CustomerMobile NVARCHAR(25) NOT NULL,
        CustomerEmail NVARCHAR(255) NULL,
        CustomerAddress NVARCHAR(500) NULL,
        Subtotal DECIMAL(18, 2) NOT NULL,
        DiscountAmount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        PackagingCharge DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        ShippingCharge DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        GstRatePercent DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
        GstType NVARCHAR(20) NOT NULL DEFAULT 'CGST_SGST' CHECK (GstType IN ('CGST_SGST', 'IGST', 'NONE')),
        GstAmount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        GrandTotal DECIMAL(18, 2) NOT NULL,
        AdvanceRequired DECIMAL(18, 2) NOT NULL,
        BalanceAmount DECIMAL(18, 2) NOT NULL,
        DeliveryTimeline NVARCHAR(255) NULL,
        TermsAndConditions NVARCHAR(MAX) NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Sent' CHECK (Status IN ('Draft', 'Sent', 'Viewed', 'Negotiation', 'Accepted', 'Rejected', 'Expired', 'Cancelled')),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Quotations_CustomerId ON dbo.Quotations(CustomerId);
    CREATE NONCLUSTERED INDEX IX_Quotations_Status ON dbo.Quotations(Status);
END
GO

-- =====================================================================================
-- TABLE 6: QuotationItems
-- Line items linked to a parent quotation
-- =====================================================================================
IF OBJECT_ID('dbo.QuotationItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.QuotationItems (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        QuotationId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Quotations(Id) ON DELETE CASCADE,
        ProductId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Products(Id) ON DELETE SET NULL,
        ProductName NVARCHAR(255) NOT NULL,
        Sku NVARCHAR(100) NULL,
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18, 2) NOT NULL,
        CustomizationNotes NVARCHAR(MAX) NULL,
        CustomizationCharge DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        ItemTotal DECIMAL(18, 2) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_QuotationItems_QuotationId ON dbo.QuotationItems(QuotationId);
END
GO

-- =====================================================================================
-- TABLE 7: Orders
-- Master orders table with payment and production status
-- =====================================================================================
IF OBJECT_ID('dbo.Orders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        OrderNumber NVARCHAR(50) NOT NULL UNIQUE,
        CustomerId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Customers(Id) ON DELETE NO ACTION,
        CustomerName NVARCHAR(255) NOT NULL,
        CustomerMobile NVARCHAR(25) NOT NULL,
        CustomerEmail NVARCHAR(255) NULL,
        CustomerAddress NVARCHAR(500) NULL,
        QuotationId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Quotations(Id) ON DELETE SET NULL,
        OrderDate DATE NOT NULL,
        RequiredDeliveryDate DATE NOT NULL,
        OrderType NVARCHAR(50) NOT NULL CHECK (OrderType IN ('Retail', 'Customized', 'Bulk', 'Corporate', 'Wholesale')),
        Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (Priority IN ('Low', 'Medium', 'High', 'Urgent')),
        TotalValue DECIMAL(18, 2) NOT NULL,
        AdvanceRequired DECIMAL(18, 2) NOT NULL,
        AdvanceReceived DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        BalanceAmount DECIMAL(18, 2) NOT NULL,
        PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (PaymentStatus IN ('Pending', 'Partially Paid', 'Paid', 'Overdue', 'Refunded')),
        ProductionStatus NVARCHAR(50) NOT NULL DEFAULT 'Production Pending' CHECK (ProductionStatus IN (
            'Production Pending', 'Production In Progress', 'Quality Check', 
            'Ready for Packaging', 'Packed', 'Ready to Dispatch', 'Completed'
        )),
        DispatchStatus NVARCHAR(50) NOT NULL DEFAULT 'Not Dispatched' CHECK (DispatchStatus IN ('Not Dispatched', 'Ready to Dispatch', 'Dispatched', 'In Transit', 'Delivered')),
        OrderStatus NVARCHAR(50) NOT NULL DEFAULT 'Order Confirmed' CHECK (OrderStatus IN (
            'Order Confirmed', 'Advance Pending', 'Payment Received', 'Customization Pending', 
            'Design Approval', 'Production Pending', 'Production In Progress', 
            'Quality Check', 'Packed', 'Ready to Dispatch', 'Dispatched', 
            'Delivered', 'Completed', 'Cancelled', 'Returned'
        )),
        Courier NVARCHAR(100) NULL,
        TrackingNumber NVARCHAR(100) NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Orders_CustomerId ON dbo.Orders(CustomerId);
    CREATE NONCLUSTERED INDEX IX_Orders_OrderStatus ON dbo.Orders(OrderStatus);
    CREATE NONCLUSTERED INDEX IX_Orders_PaymentStatus ON dbo.Orders(PaymentStatus);
    CREATE NONCLUSTERED INDEX IX_Orders_ProductionStatus ON dbo.Orders(ProductionStatus);
END
GO

-- =====================================================================================
-- TABLE 8: OrderItems
-- Line items with artisan personalization & approval metadata
-- =====================================================================================
IF OBJECT_ID('dbo.OrderItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        OrderId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
        ProductId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Products(Id) ON DELETE SET NULL,
        ProductName NVARCHAR(255) NOT NULL,
        Sku NVARCHAR(100) NULL,
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18, 2) NOT NULL,
        Total DECIMAL(18, 2) NOT NULL,
        -- Customization details
        CustomNameText NVARCHAR(255) NULL,
        CustomColor NVARCHAR(100) NULL,
        CustomDesign NVARCHAR(255) NULL,
        CustomSize NVARCHAR(100) NULL,
        CustomPhotoUrl NVARCHAR(1000) NULL,
        SpecialInstructions NVARCHAR(MAX) NULL,
        ApprovalStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Revision Required')),
        ApprovalDate DATE NULL,
        Version INT NOT NULL DEFAULT 1
    );

    CREATE NONCLUSTERED INDEX IX_OrderItems_OrderId ON dbo.OrderItems(OrderId);
END
GO

-- =====================================================================================
-- TABLE 9: Invoices
-- Tax invoices with CGST/SGST/IGST breakdown and payment balance
-- =====================================================================================
IF OBJECT_ID('dbo.Invoices', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Invoices (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        InvoiceNumber NVARCHAR(50) NOT NULL UNIQUE,
        OrderId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Orders(Id) ON DELETE NO ACTION,
        OrderNumber NVARCHAR(50) NOT NULL,
        CustomerId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Customers(Id) ON DELETE NO ACTION,
        CustomerName NVARCHAR(255) NOT NULL,
        CustomerMobile NVARCHAR(25) NULL,
        CustomerEmail NVARCHAR(255) NULL,
        CustomerGstin NVARCHAR(20) NULL,
        BillingAddress NVARCHAR(500) NOT NULL,
        InvoiceDate DATE NOT NULL,
        DueDate DATE NOT NULL,
        GstRatePercent DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
        GstType NVARCHAR(20) NOT NULL DEFAULT 'CGST_SGST' CHECK (GstType IN ('CGST_SGST', 'IGST', 'NONE')),
        Subtotal DECIMAL(18, 2) NOT NULL,
        Cgst DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        Sgst DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        Igst DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        GrandTotal DECIMAL(18, 2) NOT NULL,
        AmountPaid DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        BalanceDue DECIMAL(18, 2) NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Issued' CHECK (Status IN ('Draft', 'Issued', 'Paid', 'Partially Paid', 'Cancelled')),
        Notes NVARCHAR(MAX) NULL,
        TermsAndConditions NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Invoices_OrderId ON dbo.Invoices(OrderId);
    CREATE NONCLUSTERED INDEX IX_Invoices_CustomerId ON dbo.Invoices(CustomerId);
    CREATE NONCLUSTERED INDEX IX_Invoices_Status ON dbo.Invoices(Status);
END
GO

-- =====================================================================================
-- TABLE 10: Payments
-- Payment receipts linked to Orders and Invoices
-- =====================================================================================
IF OBJECT_ID('dbo.Payments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        ReceiptNumber NVARCHAR(50) NOT NULL UNIQUE,
        OrderId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Orders(Id) ON DELETE NO ACTION,
        OrderNumber NVARCHAR(50) NOT NULL,
        CustomerId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Customers(Id) ON DELETE NO ACTION,
        CustomerName NVARCHAR(255) NOT NULL,
        Amount DECIMAL(18, 2) NOT NULL,
        PaymentDate DATE NOT NULL,
        Mode NVARCHAR(50) NOT NULL CHECK (Mode IN ('UPI', 'Bank Transfer', 'Cash', 'Card', 'Payment Gateway', 'Other')),
        TransactionRef NVARCHAR(100) NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Completed' CHECK (Status IN ('Completed', 'Pending', 'Failed')),
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Payments_OrderId ON dbo.Payments(OrderId);
    CREATE NONCLUSTERED INDEX IX_Payments_CustomerId ON dbo.Payments(CustomerId);
END
GO

-- =====================================================================================
-- TABLE 11: Production
-- Workshop production batches, QC checks, controller artisan tracking
-- =====================================================================================
IF OBJECT_ID('dbo.Production', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Production (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        OrderId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
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
        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'In Progress', 'QC Check', 'Completed', 'Delayed')),
        Controller NVARCHAR(100) NOT NULL,
        Remarks NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Production_OrderId ON dbo.Production(OrderId);
    CREATE NONCLUSTERED INDEX IX_Production_Status ON dbo.Production(Status);
END
GO

-- =====================================================================================
-- TABLE 12: Inventory
-- Raw materials and finished goods stock levels
-- =====================================================================================
IF OBJECT_ID('dbo.Inventory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Inventory (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        Sku NVARCHAR(100) NOT NULL UNIQUE,
        Name NVARCHAR(255) NOT NULL,
        Type NVARCHAR(50) NOT NULL CHECK (Type IN ('Raw Material', 'Finished Product')),
        Category NVARCHAR(100) NOT NULL,
        Unit NVARCHAR(50) NOT NULL, -- kg, pcs, sets, jars
        CurrentStock DECIMAL(18, 2) NOT NULL,
        MinStockLevel DECIMAL(18, 2) NOT NULL,
        ReorderLevel DECIMAL(18, 2) NOT NULL,
        UnitCost DECIMAL(18, 2) NOT NULL,
        Supplier NVARCHAR(255) NULL,
        LastRestocked DATE NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Inventory_Type ON dbo.Inventory(Type);
    CREATE NONCLUSTERED INDEX IX_Inventory_Category ON dbo.Inventory(Category);
END
GO

-- =====================================================================================
-- TABLE 13: InventoryTransactions
-- Audit trail for stock consumption, restocking, scrap, and adjustments
-- =====================================================================================
IF OBJECT_ID('dbo.InventoryTransactions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.InventoryTransactions (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        InventoryId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Inventory(Id) ON DELETE CASCADE,
        TransactionType NVARCHAR(50) NOT NULL CHECK (TransactionType IN ('PURCHASE_RESTOCK', 'PRODUCTION_CONSUMED', 'SCRAP_DAMAGE', 'MANUAL_ADJUSTMENT', 'RETURN_RESTOCK')),
        QuantityChange DECIMAL(18, 2) NOT NULL,
        PreviousStock DECIMAL(18, 2) NOT NULL,
        NewStock DECIMAL(18, 2) NOT NULL,
        ReferenceOrderId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Orders(Id) ON DELETE SET NULL,
        ReferenceProductionId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Production(Id) ON DELETE SET NULL,
        Remarks NVARCHAR(MAX) NULL,
        PerformedBy NVARCHAR(100) NOT NULL,
        Timestamp DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_InventoryTransactions_InventoryId ON dbo.InventoryTransactions(InventoryId);
    CREATE NONCLUSTERED INDEX IX_InventoryTransactions_Type ON dbo.InventoryTransactions(TransactionType);
END
GO

-- =====================================================================================
-- TABLE 14: Dispatches
-- Courier, AWB tracking, packaging, and delivery tracking
-- =====================================================================================
IF OBJECT_ID('dbo.Dispatches', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Dispatches (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        OrderId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
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
        Status NVARCHAR(50) NOT NULL DEFAULT 'Ready' CHECK (Status IN ('Ready', 'Packed', 'Dispatched', 'In Transit', 'Delivered', 'Delivery Failed', 'Returned')),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_Dispatches_OrderId ON dbo.Dispatches(OrderId);
    CREATE NONCLUSTERED INDEX IX_Dispatches_AwbTrackingNumber ON dbo.Dispatches(AwbTrackingNumber);
    CREATE NONCLUSTERED INDEX IX_Dispatches_Status ON dbo.Dispatches(Status);
END
GO

-- =====================================================================================
-- TABLE 15: FollowUps
-- Sales reminders across Leads, Quotations, Orders, and Repeat Customers
-- =====================================================================================
IF OBJECT_ID('dbo.FollowUps', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FollowUps (
        Id NVARCHAR(50) NOT NULL PRIMARY KEY,
        EntityType NVARCHAR(50) NOT NULL CHECK (EntityType IN ('Lead', 'Quotation', 'Order', 'RepeatCustomer')),
        EntityId NVARCHAR(50) NOT NULL,
        CustomerName NVARCHAR(255) NOT NULL,
        ContactNumber NVARCHAR(25) NOT NULL,
        ScheduledDate DATE NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (Priority IN ('Low', 'Medium', 'High', 'Urgent')),
        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Completed', 'Overdue', 'Cancelled')),
        Notes NVARCHAR(MAX) NULL,
        CompletedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_FollowUps_ScheduledDate ON dbo.FollowUps(ScheduledDate);
    CREATE NONCLUSTERED INDEX IX_FollowUps_Status ON dbo.FollowUps(Status);
    CREATE NONCLUSTERED INDEX IX_FollowUps_EntityType ON dbo.FollowUps(EntityType);
END
GO
