# Vartu Creations — System Architecture & Master Specification

## 1. System Architecture Overview

Vartu Creations CRM is an artisan-focused SaaS application architected to handle the end-to-end lifecycle of custom, handmade craft commerce:

```
[ Inbound Channels: Instagram, WhatsApp, Website, Meesho, Exhibitions ]
                                 │
                                 ▼
                     [ Lead Management & Pipeline ]
                                 │
                                 ▼
                    [ Customer 360° Directory ]
                                 │
                                 ▼
             [ Product Catalogue & Central Costing Engine ]
                                 │
                                 ▼
               [ Branded Quotation & GST Engine ] ──────► [ PDF Export ]
                                 │
                                 ▼
             [ Order Management & Versioned Customization ]
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
       [ Payment Ledger ]              [ Production & QC Tracking ]
       (UPI / NEFT / Advance)           (Resin Curing 24-48h, Molds)
                │                                 │
                └────────────────┬────────────────┘
                                 │
                                 ▼
                    [ Dispatch & Couriers (AWB) ]
                    (Delhivery, BlueDart, DTDC)
                                 │
                                 ▼
                [ Follow-up Engine & Repeat Client CRM ]
                                 │
                                 ▼
         [ Gemini AI Co-pilot & Sales Intelligence Analytics ]
```

---

## 2. Technology Stack

- **Frontend Framework**: React 19 SPA with TypeScript
- **Styling & Design System**: Tailwind CSS v4, custom artisanal typography (Playfair Display serif for brand headings, Plus Jakarta Sans for UI and tables, tabular numbers for finances).
- **Icons**: Lucide React
- **Full-Stack Runtime**: Express.js server on Node.js (`server.ts`) hosting REST API endpoints and mounting Vite development middleware.
- **AI Engine**: `@google/genai` TypeScript SDK running strictly server-side using `gemini-3.8-flash` with zero client-side exposure of `GEMINI_API_KEY`.
- **Database Architecture**: PostgreSQL relational database schema with organization-level multi-tenancy isolation (`organization_id`).
- **Production & Deployment**: Containerized on Cloud Run / Vercel with Supabase PostgreSQL and GitHub CI/CD.

---

## 3. User Roles & Permissions (RBAC)

1. **Owner/Admin**:
   - Complete read/write access to all modules, financial ledgers, settings, user permissions, and AI insights.
2. **Sales/Order Manager**:
   - Manages Leads, Quotations, Customers, Orders, and Follow-ups. Read-only access to inventory.
3. **Production Artisan / QC Controller**:
   - Restricted to Production records, quality checks, batch completion statuses, and inventory consumption.
4. **Accounts**:
   - Access to Payment recording, GST Tax Invoices, financial reports, and outstanding debt monitoring.
5. **Viewer**:
   - Read-only consultation access without write permissions.

---

## 4. Central Pricing & Margin Formula Engine

All calculations are unified in `src/utils/calculations.ts`:

- **Total Cost**:
  $$\text{Total Cost} = \text{Raw Material} + \text{Labour} + \text{Packaging} + \text{Other Costs}$$
- **Gross Profit**:
  $$\text{Gross Profit} = \text{Selling Price} - \text{Total Cost}$$
- **Gross Margin %**:
  $$\text{Gross Margin \%} = \frac{\text{Selling Price} - \text{Total Cost}}{\text{Selling Price}} \times 100$$
- **Production Balance Qty**:
  $$\text{Balance Qty} = \text{Required Qty} - \text{Produced Qty} - \text{Rejected Qty}$$
- **Taxable Subtotal**:
  $$\text{Taxable Subtotal} = \text{Items Subtotal} + \text{Customization} - \text{Discount} + \text{Packaging} + \text{Shipping}$$
- **GST Amount**:
  $$\text{GST Amount} = \frac{\text{Taxable Subtotal} \times \text{GST Rate}}{100}$$

---

## 5. Security Architecture

1. **Server-Side API Key Isolation**:
   The `GEMINI_API_KEY` is never bundled into client assets; it is injected strictly on the server in `server.ts`.
2. **Duplicate Customer Detection**:
   Verifies phone numbers, WhatsApp digits, emails, and company GSTINs before creating new customer records to eliminate fragmentation.
3. **Input Sanitization**:
   All user inputs undergo strict validation with strong TypeScript typings.
4. **Data Isolation**:
   `organization_id` embedded across all schema tables ensures future multi-tenant segregation.
