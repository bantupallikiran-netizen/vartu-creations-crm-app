# Vartu Creations — AI-Powered CRM & Order Management System

A production-ready CRM, quotation generator, custom order tracker, inventory, production, dispatch, and AI sales intelligence platform tailored for **Vartu Creations** handmade crafts and bespoke gifts business.

---

## 🌟 Key Features

1. **Inbound Leads & Opportunities**:
   - Capture inquiries from Instagram, WhatsApp, Meesho, Website, Referrals & Stalls.
   - Filter by status, priority, and source.
   - 1-click WhatsApp web chat & click-to-call.
   - AI Lead Intelligence powered by Google Gemini (analyzes requirements, buying intent, urgency, and drafts custom WhatsApp replies).

2. **Customer 360° Directory**:
   - Customer profile with Customer Lifetime Value (LTV), total orders, and outstanding debt balance.
   - Order history, past quotations, and communication logs.
   - Duplicate customer detection guardrails.

3. **Product Catalogue & Margin Costing Engine**:
   - Tiered pricing support: Retail, Bulk (MOQ 20+), Wholesale (MOQ 50+), Corporate.
   - Detailed costing breakdown: Raw Materials, Labour, Packaging, Other costs.
   - Automatic Gross Profit & Gross Margin % calculation.

4. **Branded Quotations & PDF Generation**:
   - Central pricing calculation engine with Indian taxation (CGST + SGST or IGST).
   - Automated 50% advance requirement & balance calculation.
   - Branded printable/downloadable PDF with business logo, bank coordinates, and artisan terms.
   - 1-click conversion from Quotation to Order.

5. **Order Lifecycle & Customization Tracking**:
   - Multi-tier order tracking: Retail, Customized, Bulk B2B, Corporate Hampers.
   - Design version approval tracking (V1, V2, Customer Approved).
   - Real-time status: Confirmed → Advance → Production → QC → Packed → Dispatched → Delivered.

6. **Studio Production & Quality Control**:
   - Batch tracking for resin curing (24-48 hrs), terrazzo candle holders, and Rakhis.
   - Automated Balance Formula: `Balance Qty = Required - Produced - Rejected`.
   - Controller assignment and inspection notes.

7. **Inventory & Raw Materials**:
   - Tracks epoxy resins, silicon molds, pigments, organic soy wax, and gift boxes.
   - Live Health alerts: 🔴 Out of Stock, 🟠 Critical, 🟡 Low Stock, 🟢 Healthy.
   - Quick Stock In / Stock Out adjustment engine.

8. **Payment Ledger & GST Invoices**:
   - Advance and final payment recording with UPI UTR and bank transfer refs.
   - Automatic order balance settlement.
   - GST tax invoice generation.

9. **Dispatch & Domestic Logistics**:
   - Courier assignment (Delhivery, Blue Dart, DTDC, Speed Post, Porter).
   - AWB tracking number logging and delivery status updates.

10. **Follow-Up Task Engine**:
    - Segmented into 🔴 Overdue, 🟡 Due Today, and 🟢 Upcoming.
    - Quick WhatsApp message trigger and 1-click completion.

11. **Vartu AI Intelligence Suite (Gemini 3.8 Flash)**:
    - **AI Sales Co-Pilot**: Answers natural language questions against live CRM snapshots.
    - **AI Copywriter**: Generates personalized follow-ups for WhatsApp, Instagram DM, or Email across multiple tones.
    - **Gift Curator**: Matches catalog items for customer budgets and quantities.
    - **Delivery Risk Analyzer**: Detects curing bottlenecks and deadline risks.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Express.js server on Node.js (`server.ts`)
- **AI**: `@google/genai` TypeScript SDK (server-side `gemini-3.8-flash`)
- **Database**: Microsoft SQL Server (`VartuCRM` via `mssql` connection pool)

---

## 🚀 How to Run Locally on Your PC with SQL Server

Follow these steps to run the complete Vartu Creations application on your Windows PC (`DESKTOP-BQDO1QT`) with your persistent SQL Server `VartuCRM` database:

### Step 1: Export from Google AI Studio to GitHub
1. In the **Google AI Studio** interface, click the **Export to GitHub** (or **Share** / **Download Code**) button in the top navigation bar.
2. Select or create your repository (e.g. `your-username/vartu-creations-crm`).
3. Click **Push to GitHub** to sync all files.

### Step 2: Clone the Repository to Your PC
Open **PowerShell** or **Command Prompt** on your PC (`DESKTOP-BQDO1QT`) and run:
```bash
git clone https://github.com/bantupallikiran-netizen/vartu-creations-crm.git
cd vartu-creations-crm
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Configure SQL Server Tables
1. Open **SQL Server Management Studio (SSMS)** or **Azure Data Studio**.
2. Connect to your instance: `DESKTOP-BQDO1QT` (or `localhost`).
3. Open the file **`schema-sqlserver.sql`** located in the project root folder.
4. Execute the script to create the `VartuCRM` database and all 15 tables (`Customers`, `Leads`, `Products`, `Orders`, etc.).

### Step 5: Configure Local Environment Variables
Create a `.env` file in the project root:
```ini
# SQL Server Configuration (Windows Integrated Authentication)
DB_SERVER="DESKTOP-BQDO1QT"
DB_DATABASE="VartuCRM"

# Optional: If using a named SQL instance:
# DB_INSTANCE_NAME="SQLEXPRESS"

# Optional: Gemini AI Key for sales co-pilot
GEMINI_API_KEY="your_gemini_api_key_here"
```

> **No password required**: Because Windows Integrated Authentication is used (`msnodesqlv8`), Node.js automatically authenticates using your current Windows login credentials (the same account you use in SSMS). No `sa` account or SQL passwords are required!

### Step 6: Start the Local Development Server
```bash
npm run dev
```

### Step 7: Access the Application
Open your browser to:
```
http://localhost:3000
```

* The app will connect directly to `DESKTOP-BQDO1QT` / `VartuCRM`.
* The TopBar will display **SQL Server: Online** with a green status indicator.
* Any customer, lead, or order you create will now be stored directly in your SQL Server database as the persistent source of truth.

