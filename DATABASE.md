# Vartu Creations — SQL Server Architecture & Database Schema

## 1. System Architecture
```
┌────────────────────────────────────────┐
│     React Frontend (Vite + Tailwind)    │
│  - No direct database connection       │
│  - No credentials stored in client      │
└───────────────────┬────────────────────┘
                    │ HTTP REST /api/*
                    ▼
┌────────────────────────────────────────┐
│     Node.js Backend API (Express)      │
│  - Connection pooling via `mssql`       │
│  - Parameterized T-SQL queries         │
│  - Environment variables (.env)        │
└───────────────────┬────────────────────┘
                    │ TCP / TDS Protocol (Port 1433)
                    ▼
┌────────────────────────────────────────┐
│     SQL Server (DESKTOP-BQDO1QT)       │
│  - Database: VartuCRM                  │
│  - Source of Truth                     │
└────────────────────────────────────────┘
```

## 2. Entity Relationship Overview (15 Tables)
```
Users (Role-based access)
Customers (1) ────┬────< Leads (N)
                  ├────< Quotations (1) ────< QuotationItems (N)
                  ├────< Orders (1) ────────┬────< OrderItems (N)
                  │                         ├────< Production (N)
                  │                         ├────< Payments (N)
                  │                         ├────< Invoices (N)
                  │                         └────< Dispatches (N)
                  └────< FollowUps (N)

Products (1) ─────┬────< QuotationItems (N)
                  └────< OrderItems (N)

Inventory (1) ────< InventoryTransactions (N)
```

## 3. Configuration Variables
Defined in `.env`:
- `DB_SERVER`: `DESKTOP-BQDO1QT`
- `DB_DATABASE`: `VartuCRM`
- Authentication: **Windows Integrated Authentication (`Trusted_Connection=Yes`)**
- Driver: `msnodesqlv8` (Microsoft SQL Server driver for Node.js)
- No `sa` account, no `DB_USER`, and no `DB_PASSWORD` required!
- `DB_INSTANCE_NAME`: (Optional, if using named instance e.g. `DESKTOP-BQDO1QT\SQLEXPRESS`)
- `DB_ODBC_DRIVER`: (Optional, auto-detects `ODBC Driver 17 for SQL Server`, `ODBC Driver 18 for SQL Server`, or `SQL Server`)
