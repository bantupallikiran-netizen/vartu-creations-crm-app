export type LeadSource =
  | 'Instagram'
  | 'WhatsApp'
  | 'Facebook'
  | 'Website'
  | 'Meesho'
  | 'Referral'
  | 'Exhibition'
  | 'Stall'
  | 'Existing Customer'
  | 'Phone'
  | 'Walk-in'
  | 'Other';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Requirement Received'
  | 'Quotation Required'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Advance Pending'
  | 'Order Confirmed'
  | 'Not Interested'
  | 'Lost'
  | 'On Hold';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Lead {
  id: string;
  leadNumber: string;
  date: string;
  customerName: string;
  mobile: string;
  whatsapp: string;
  email?: string;
  instagramId?: string;
  companyName?: string;
  leadSource: LeadSource;
  productInterest: string[];
  quantity: number;
  customizationRequired: boolean;
  customizationNotes?: string;
  expectedBudget?: number;
  expectedDeliveryDate?: string;
  priority: Priority;
  status: LeadStatus;
  assignedUser: string;
  nextFollowUpDate?: string;
  remarks?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type CustomerType =
  | 'Retail'
  | 'Corporate'
  | 'Wholesale'
  | 'Reseller'
  | 'Event'
  | 'Gift Buyer'
  | 'Repeat Customer';

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  mobile: string;
  whatsapp: string;
  email?: string;
  instagram?: string;
  company?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  gstin?: string;
  customerType: CustomerType;
  customerSource: LeadSource | string;
  firstOrderDate?: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalPurchaseValue: number;
  outstandingAmount: number;
  customerRating: number;
  notes?: string;
  lifetimeValue: number;
  createdAt: string;
}

export interface ProductCosting {
  rawMaterial: number;
  labour: number;
  packaging: number;
  other: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  imageUrl?: string;
  sellingPrice: number;
  costPrice: number;
  costing: ProductCosting;
  moq: number;
  bulkPrice: number;
  bulkMoq: number;
  wholesalePrice: number;
  wholesaleMoq: number;
  corporatePrice?: number;
  stockQuantity: number;
  minStockLevel: number;
  productionTimeDays: number;
  customizationAvailable: boolean;
  customizationCharge: number;
  active: boolean;
}

export type QuotationStatus =
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Negotiation'
  | 'Accepted'
  | 'Rejected'
  | 'Expired'
  | 'Cancelled';

export interface QuotationItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  customizationNotes?: string;
  customizationCharge: number;
  itemTotal: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  customerEmail?: string;
  items: QuotationItem[];
  discountAmount: number;
  packagingCharge: number;
  shippingCharge: number;
  gstRatePercent: number;
  gstType: 'CGST_SGST' | 'IGST' | 'NONE';
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  advanceRequired: number;
  balanceAmount: number;
  deliveryTimeline: string;
  termsAndConditions: string;
  status: QuotationStatus;
  createdAt: string;
}

export type OrderType = 'Retail' | 'Customized' | 'Bulk' | 'Corporate' | 'Wholesale';

export type OrderStatus =
  | 'Order Confirmed'
  | 'Advance Pending'
  | 'Payment Received'
  | 'Customization Pending'
  | 'Design Approval'
  | 'Production Pending'
  | 'Production In Progress'
  | 'Quality Check'
  | 'Packed'
  | 'Ready to Dispatch'
  | 'Dispatched'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'Returned';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  customizationDetails?: {
    nameText?: string;
    color?: string;
    design?: string;
    size?: string;
    photoUrl?: string;
    specialInstructions?: string;
    approvalStatus: 'Pending' | 'Approved' | 'Revision Required';
    approvalDate?: string;
    version: number;
  };
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  customerAddress: string;
  quotationId?: string;
  orderDate: string;
  requiredDeliveryDate: string;
  orderType: OrderType;
  priority: Priority;
  items: OrderItem[];
  totalValue: number;
  advanceRequired: number;
  advanceReceived: number;
  balanceAmount: number;
  paymentStatus: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Refunded';
  productionStatus:
    | 'Production Pending'
    | 'Production In Progress'
    | 'Quality Check'
    | 'Ready for Packaging'
    | 'Packed'
    | 'Ready to Dispatch'
    | 'Completed';
  dispatchStatus: 'Not Dispatched' | 'Ready to Dispatch' | 'Dispatched' | 'In Transit' | 'Delivered';
  orderStatus: OrderStatus;
  courier?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface ProductionRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  sku: string;
  requiredQty: number;
  producedQty: number;
  rejectedQty: number;
  balanceQty: number;
  startDate?: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  status: 'Pending' | 'In Progress' | 'QC Check' | 'Completed' | 'Delayed';
  controller: string;
  remarks?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  type: 'Raw Material' | 'Finished Product';
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  reorderLevel: number;
  unitCost: number;
  supplier?: string;
  lastRestocked?: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  mode: 'UPI' | 'Bank Transfer' | 'Cash' | 'Card' | 'Payment Gateway' | 'Other';
  transactionRef: string;
  status: 'Completed' | 'Pending' | 'Failed';
  notes?: string;
}

export interface InvoiceItem {
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  customizationDetails?: string;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerMobile?: string;
  customerEmail?: string;
  customerGstin?: string;
  billingAddress: string;
  invoiceDate: string;
  dueDate: string;
  items?: InvoiceItem[];
  gstRatePercent?: number;
  gstType?: 'CGST_SGST' | 'IGST' | 'NONE';
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  status: 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Cancelled';
  notes?: string;
  termsAndConditions?: string;
}

export interface DispatchRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  shippingAddress: string;
  courier: string;
  awbTrackingNumber: string;
  dispatchDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  shippingCharge: number;
  status: 'Ready' | 'Packed' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Delivery Failed' | 'Returned';
}

export interface FollowUp {
  id: string;
  entityType: 'Lead' | 'Quotation' | 'Order' | 'RepeatCustomer';
  entityId: string;
  customerName: string;
  contactNumber: string;
  scheduledDate: string;
  title: string;
  priority: Priority;
  status: 'Pending' | 'Completed' | 'Overdue' | 'Cancelled';
  notes?: string;
  completedAt?: string;
}

export type UserRole =
  | 'Owner/Admin'
  | 'Sales/Order Manager'
  | 'Production'
  | 'Accounts'
  | 'Viewer';

export interface CompanySettings {
  businessName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  panNumber?: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankUpi: string;
  defaultGstRate: number;
  defaultAdvancePercent: number;
  currency: string;
  orderPrefix: string;
  quotationPrefix: string;
  invoicePrefix: string;
  currentRole: UserRole;
}

export type StageType = 'Lead' | 'Quotation' | 'Order' | 'Invoice' | 'General';

export type DocumentFileType = 'image' | 'video' | 'pdf' | 'spreadsheet' | 'audio' | 'document' | 'other';

export interface CrmDocument {
  id: string;
  name: string;
  fileType: DocumentFileType;
  mimeType?: string;
  url: string;
  thumbnailUrl?: string;
  size: string;
  stage: StageType;
  linkedEntityId: string;
  linkedEntityNumber?: string;
  linkedCustomerName: string;
  customerMobile?: string;
  customerEmail?: string;
  category: string;
  notes?: string;
  sharedChannels?: string[];
  lastSharedAt?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export type ActivityAction =
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_SHARED'
  | 'QUOTATION_CREATED'
  | 'QUOTATION_SENT'
  | 'PAYMENT_RECORDED'
  | 'STATUS_UPDATED'
  | 'NOTE_ADDED'
  | 'LEAD_CREATED';

export interface ActivityLog {
  id: string;
  stage: StageType;
  entityId: string;
  entityNumber?: string;
  customerName: string;
  action: ActivityAction;
  title: string;
  description: string;
  metadata?: {
    documentId?: string;
    fileName?: string;
    fileType?: DocumentFileType;
    shareChannel?: 'WhatsApp' | 'Email' | 'Direct Link' | 'Download';
    sharedTo?: string;
    category?: string;
    amount?: number;
    url?: string;
  };
  performedBy: string;
  timestamp: string;
}
