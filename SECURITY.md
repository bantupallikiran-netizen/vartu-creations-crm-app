# Vartu Creations — Security & Data Protection Specification

## 1. Authentication & Role-Based Access Control (RBAC)

1. **Role Separation**:
   - `Owner/Admin`: Full read/write access.
   - `Sales/Order Manager`: Restricted from altering system configuration or deleting financial records.
   - `Production Artisan`: Limited to updating batch quantities, rejection reasons, and QC status.
   - `Accounts`: Restricted from modifying product formulas or manufacturing schedules.
   - `Viewer`: Read-only.

2. **Server-Side API Key Defense**:
   - The Gemini AI API key is never bundled in frontend code or transmitted across the wire to the browser.
   - All `@google/genai` calls happen server-side inside `server.ts`.

3. **Duplicate Detection Guardrails**:
   - Prevents duplicate customer entries by cross-referencing normalized phone digits, WhatsApp numbers, emails, and GSTIN identifiers.

4. **Multi-Tenancy Guardrail**:
   - Every database query and table schema contains an `organization_id` column to prevent accidental cross-tenant data leaks.
