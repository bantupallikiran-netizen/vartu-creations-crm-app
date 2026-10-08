# Vartu Creations — AI Architecture & Integration Specification

## 1. Overview

Vartu Creations leverages Google Gemini models via `@google/genai` exclusively from server-side Express handlers (`server.ts`).
Client components communicate via `/api/ai/*` routes. The `GEMINI_API_KEY` is strictly managed via environment variables and never exposed to browser execution contexts.

Model Choice: **`gemini-3.8-flash`** (High efficiency, low latency, structured JSON response capability).

---

## 2. Server-Side Endpoints

### 1. `POST /api/ai/lead-summary`
- **Objective**: Ingests lead data, interested products, and notes to produce:
  - Concise Customer Requirement
  - Buying Intent (`High` | `Medium` | `Low`)
  - Estimated Budget & Urgency
  - Key Customer Objections
  - Recommended Next Action for the sales team
  - Ready-to-send personalized WhatsApp message copy.

### 2. `POST /api/ai/follow-up-message`
- **Objective**: Generates tone-aware, channel-specific messages for WhatsApp, Instagram DM, or Email.
- **Tones Supported**: Warm & Friendly, Professional, Urgent / Festival Closing, Festive & Joyful.
- **Objectives Supported**: Quotation Follow-up, Advance Payment Reminder, Delivered Order Feedback, Loyal Customer Repeat Purchase.

### 3. `POST /api/ai/recommend-products`
- **Objective**: Searches the actual Vartu product catalogue and suggests matching items for client specifications (e.g. employee gifts under ₹500).
- **Rule**: Never invents nonexistent products or prices; strictly matches database items.

### 4. `POST /api/ai/delivery-risk-analysis`
- **Objective**: Audits active orders against required delivery dates and resin curing times (24-48 hours).
- **Output**: Identifies high-risk orders with bottleneck causes and suggested operational remedies.

### 5. `POST /api/ai/sales-assistant`
- **Objective**: Natural language co-pilot answering executive queries (e.g., "What are my highest margin products this month?", "How much balance is outstanding?").
- **Grounding**: Grounded strictly in live serialized CRM snapshot data.
