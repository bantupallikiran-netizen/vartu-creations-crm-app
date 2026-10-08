# Vartu Creations — Testing Strategy & Quality Assurance

## 1. End-to-End Workflow Verification

The following complete business workflow has been verified:

1. **Lead Capture**: Create new inquiry from Instagram / WhatsApp.
2. **AI Lead Analysis**: Run Gemini summary to determine buying intent and draft personalized WhatsApp copy.
3. **Quotation Generation**: Select items, apply custom engraving fee, auto-calculate 18% GST and 50% advance.
4. **Branded PDF Preview**: Verify logo, terms, and printable layout.
5. **Convert to Order**: 1-click conversion creates Order `VC-ORD-2026-XXXX`, assigns production records, and records customer profile.
6. **Production & Curing**: Update produced vs rejected quantities; confirm `Balance = Required - Produced - Rejected`.
7. **Payment Recording**: Record 50% advance via UPI with transaction reference; confirm balance due updates automatically.
8. **Dispatch & Logistics**: Assign courier (Delhivery/BlueDart) and AWB tracking number; transition order to `Dispatched` and `Delivered`.
9. **Follow-up & Repeat Sales**: Verify customer appears in Repeat Customer dashboard with updated Lifetime Value (LTV).
