import React, { useState, useEffect } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { LeadSource, OrderType, Priority, Order } from '../types.ts';
import { formatCurrency } from '../utils/calculations.ts';
import {
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  Sparkles,
  ArrowRight,
  Wand2,
  AlertTriangle,
} from 'lucide-react';

interface ToastState {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export const QuickActionModal: React.FC = () => {
  const {
    quickAction,
    setQuickAction,
    addLead,
    addOrder,
    addPayment,
    addCustomer,
    checkDuplicateCustomer,
    orders,
    products,
    customers,
    setActiveTab,
  } = useCrm();

  // Submission & Loading State Management
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdOrderRef, setCreatedOrderRef] = useState<Order | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Lead State
  const [leadName, setLeadName] = useState('');
  const [leadMobile, setLeadMobile] = useState('');
  const [leadSource, setLeadSource] = useState<LeadSource>('Instagram');
  const [productInterest, setProductInterest] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [customizationRequired, setCustomizationRequired] = useState(true);
  const [customNotes, setCustomNotes] = useState('');
  const [expectedBudget, setExpectedBudget] = useState(500);
  const [priority, setPriority] = useState<Priority>('High');

  // Quick Order State
  const [orderCustId, setOrderCustId] = useState('');
  const [orderCustName, setOrderCustName] = useState('');
  const [orderCustMobile, setOrderCustMobile] = useState('');
  const [orderCustEmail, setOrderCustEmail] = useState('');
  const [orderCustAddress, setOrderCustAddress] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('Customized');
  const [orderPriority, setOrderPriority] = useState<Priority>('High');
  const [orderDeliveryDate, setOrderDeliveryDate] = useState(() => {
    return new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  });
  const [orderProductId, setOrderProductId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderUnitPrice, setOrderUnitPrice] = useState(0);
  const [orderCustomCharge, setOrderCustomCharge] = useState(0);
  const [orderCustomText, setOrderCustomText] = useState('');
  const [orderCustomColor, setOrderCustomColor] = useState('');
  const [orderCustomNotes, setOrderCustomNotes] = useState('');
  const [orderAdvanceReceived, setOrderAdvanceReceived] = useState(0);

  // Payment State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(1500);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Bank Transfer' | 'Cash' | 'Card'>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('50% advance payment via UPI');

  // Reset feedback & created order when modal opens or switches
  useEffect(() => {
    setFormError(null);
    setSuccessMessage(null);
    setCreatedOrderRef(null);
    setIsSubmitting(false);
  }, [quickAction]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Synchronize product & order defaults safely
  useEffect(() => {
    if (products.length > 0) {
      if (!productInterest) {
        setProductInterest(products[0].name);
      }
      // If orderProductId is empty or not in products, set to first product
      if (!orderProductId || !products.some((p) => p.id === orderProductId)) {
        const firstProd = products[0];
        setOrderProductId(firstProd.id);
        setOrderUnitPrice(firstProd.sellingPrice);
        const initialSubtotal = firstProd.sellingPrice * orderQuantity + orderCustomCharge;
        setOrderAdvanceReceived(Math.round(initialSubtotal * 0.5));
      }
    }
  }, [products, quickAction]);

  // Sync default order for payment action
  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
      setPaymentAmount(orders[0].balanceAmount > 0 ? orders[0].balanceAmount : orders[0].totalValue);
      setPaymentRef(`UPI/HDFC/${Date.now().toString().slice(-6)}`);
    }
  }, [orders, quickAction]);

  if (!quickAction) return null;

  // Handle selecting existing customer in Quick Order
  const handleSelectOrderCustomer = (cId: string) => {
    setOrderCustId(cId);
    setFormError(null);
    if (!cId) {
      // Switched to manual new customer entry, keep existing values or let user edit
      return;
    }
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setOrderCustName(found.name);
      setOrderCustMobile(found.mobile);
      setOrderCustEmail(found.email || '');
      const addr =
        typeof found.address === 'object' && found.address
          ? `${found.address.street || ''}, ${found.address.city || ''}, ${found.address.state || ''}`
              .replace(/^,\s*|,\s*$/g, '')
              .replace(/,\s*,/g, ',')
          : String(found.address || '');
      setOrderCustAddress(addr);
    }
  };

  // Helper to auto-fill sample customer details for rapid testing
  const handleAutoFillSampleData = () => {
    setFormError(null);
    setOrderCustId('');
    setOrderCustName('Pooja Reddy');
    setOrderCustMobile('+91 98490 12345');
    setOrderCustEmail('pooja.reddy@example.com');
    setOrderCustAddress('Flat 402, Green Acres Apt, Madhapur, Hyderabad');
    setOrderType('Customized');
    setOrderPriority('High');
    setOrderCustomText('Ananya & Arjun');
    setOrderCustomColor('Ocean Turquoise & 24K Gold Foil');
    setOrderCustomNotes('High gloss food-safe resin coat. Include gift packaging.');
    setOrderCustomCharge(250);
    if (products.length > 0) {
      const prod = products[0];
      setOrderProductId(prod.id);
      setOrderUnitPrice(prod.sellingPrice);
      const total = prod.sellingPrice * orderQuantity + 250;
      setOrderAdvanceReceived(Math.round(total * 0.5));
    }
    setToast({
      type: 'info',
      title: 'Sample Data Loaded',
      message: 'Demo customer details and customization specs have been auto-filled.',
    });
  };

  // Handle product change in Quick Order
  const handleOrderProductChange = (pId: string) => {
    setOrderProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setOrderUnitPrice(prod.sellingPrice);
      const total = prod.sellingPrice * orderQuantity + orderCustomCharge;
      setOrderAdvanceReceived(Math.round(total * 0.5));
    }
  };

  const calculatedSubtotal =
    (Number(orderUnitPrice) || 0) * (Number(orderQuantity) || 1) + (Number(orderCustomCharge) || 0);
  const orderTotalValue = Math.max(0, calculatedSubtotal);
  const orderBalanceAmount = Math.max(0, orderTotalValue - (Number(orderAdvanceReceived) || 0));

  // ==========================================
  // QUICK ORDER SUBMISSION (With Comprehensive Try-Catch & Data Mapping)
  // ==========================================
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setCreatedOrderRef(null);
    setIsSubmitting(true);

    try {
      // 1. Validation & Input Sanitization
      const trimmedCustName = orderCustName.trim();
      const trimmedCustMobile = orderCustMobile.trim();
      const trimmedCustEmail = orderCustEmail.trim();
      const trimmedCustAddress = orderCustAddress.trim();
      const qty = Math.max(1, Number(orderQuantity) || 1);
      const unitRate = Math.max(0, Number(orderUnitPrice) || 0);
      const customCharge = Math.max(0, Number(orderCustomCharge) || 0);
      const lineItemTotal = unitRate * qty + customCharge;
      const advReceived = Math.min(lineItemTotal, Math.max(0, Number(orderAdvanceReceived) || 0));
      const balAmount = Math.max(0, lineItemTotal - advReceived);

      if (!trimmedCustName) {
        throw new Error('Customer Name is required. Please enter the recipient or buyer name.');
      }

      if (!trimmedCustMobile) {
        throw new Error('Mobile / WhatsApp number is required to confirm order updates.');
      }

      const digitsOnly = trimmedCustMobile.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        throw new Error('Please enter a valid 10-digit mobile or WhatsApp phone number.');
      }

      if (!orderDeliveryDate) {
        throw new Error('Please select a required delivery deadline date.');
      }

      // 2. Resolve Selected Catalogue Product
      let selProd = products.find((p) => p.id === orderProductId);
      if (!selProd && products.length > 0) {
        selProd = products[0];
      }
      if (!selProd) {
        throw new Error('No product selected. Please select a valid product from the catalogue.');
      }

      // 3. Customer Resolution & Deduplication (Matches Backend Model)
      let resolvedCustomerId = orderCustId;
      if (!resolvedCustomerId) {
        // Check for existing customer by phone or email
        const existingCust = checkDuplicateCustomer({
          mobile: trimmedCustMobile,
          email: trimmedCustEmail || undefined,
        });

        if (existingCust) {
          resolvedCustomerId = existingCust.id;
        } else {
          // Auto-create new customer in the CRM
          const newCust = addCustomer({
            name: trimmedCustName,
            mobile: trimmedCustMobile,
            whatsapp: trimmedCustMobile,
            email: trimmedCustEmail || undefined,
            address: {
              street: trimmedCustAddress || 'Craft Studio Pickup',
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500001',
            },
            customerType:
              orderType === 'Bulk' || orderType === 'Corporate' || orderType === 'Wholesale'
                ? 'Corporate'
                : 'Retail',
            customerSource: 'Direct Customer',
            totalOrders: 1,
            totalPurchaseValue: lineItemTotal,
            outstandingAmount: balAmount,
            customerRating: 5,
            notes: 'Auto-registered via Quick Order',
          });
          resolvedCustomerId = newCust.id;
        }
      }

      // 4. Customization Spec Mapping
      const hasCustomization =
        orderType === 'Customized' ||
        Boolean(orderCustomText.trim()) ||
        Boolean(orderCustomColor.trim()) ||
        Boolean(orderCustomNotes.trim()) ||
        customCharge > 0;

      const customizationDetails = hasCustomization
        ? {
            nameText: orderCustomText.trim() || undefined,
            color: orderCustomColor.trim() || undefined,
            specialInstructions: orderCustomNotes.trim() || undefined,
            approvalStatus: 'Approved' as const,
            approvalDate: new Date().toISOString().split('T')[0],
            version: 1,
          }
        : undefined;

      // 5. Explicit Data Mapping to Order Model
      const orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt'> = {
        customerId: resolvedCustomerId,
        customerName: trimmedCustName,
        customerMobile: trimmedCustMobile,
        customerEmail: trimmedCustEmail || undefined,
        customerAddress: trimmedCustAddress || 'Craft Studio Pickup, Hyderabad, Telangana',
        orderDate: new Date().toISOString().split('T')[0],
        requiredDeliveryDate: orderDeliveryDate,
        orderType,
        priority: orderPriority,
        items: [
          {
            productId: selProd.id,
            productName: selProd.name,
            sku: selProd.sku,
            quantity: qty,
            unitPrice: unitRate,
            customizationDetails,
            total: lineItemTotal,
          },
        ],
        totalValue: lineItemTotal,
        advanceRequired: Math.round(lineItemTotal * 0.5),
        advanceReceived: advReceived,
        balanceAmount: balAmount,
        paymentStatus: balAmount <= 0 ? 'Paid' : advReceived > 0 ? 'Partially Paid' : 'Pending',
        productionStatus: 'Production Pending',
        dispatchStatus: 'Not Dispatched',
        orderStatus: advReceived > 0 ? 'Production Pending' : 'Advance Pending',
        notes: orderCustomNotes.trim() || 'Created via Quick Action Modal',
      };

      // 6. Execute Order Creation in CRM Context
      const createdOrder = addOrder(orderPayload);
      if (!createdOrder || !createdOrder.id) {
        throw new Error('Failed to generate order record in system. Please try again.');
      }

      // 7. Record Payment Receipt if Advance was Received
      if (advReceived > 0) {
        addPayment({
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          customerId: resolvedCustomerId,
          customerName: trimmedCustName,
          amount: advReceived,
          paymentDate: new Date().toISOString().split('T')[0],
          mode: 'UPI',
          transactionRef: `UPI/ADV/${Date.now().toString().slice(-6)}`,
          status: 'Completed',
          notes: `Advance payment for ${createdOrder.orderNumber}`,
        });
      }

      // 8. Success State & Feedback
      setCreatedOrderRef(createdOrder);
      const successText = `Order ${createdOrder.orderNumber} successfully created for ${trimmedCustName}! Total: ${formatCurrency(lineItemTotal)}.`;
      setSuccessMessage(successText);
      setToast({
        type: 'success',
        title: 'Order Created Successfully',
        message: successText,
      });

      // Automatically close modal after brief delay unless user wants to view it
      setTimeout(() => {
        setQuickAction(null);
      }, 2000);
    } catch (err: any) {
      console.error('Order creation error in QuickActionModal:', err);
      const errMsg =
        err?.message ||
        'An unexpected error occurred while creating the order. Please verify your inputs and try again.';
      setFormError(errMsg);
      setToast({
        type: 'error',
        title: 'Order Creation Failed',
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // QUICK LEAD SUBMISSION (With Try-Catch & Loading)
  // ==========================================
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const trimmedName = leadName.trim();
      const trimmedMobile = leadMobile.trim();

      if (!trimmedName) throw new Error('Customer Name is required to register lead.');
      if (!trimmedMobile) throw new Error('Customer Mobile or WhatsApp number is required.');

      const newLead = addLead({
        date: new Date().toISOString().split('T')[0],
        customerName: trimmedName,
        mobile: trimmedMobile,
        whatsapp: trimmedMobile,
        leadSource,
        productInterest: [productInterest || products[0]?.name || 'Handmade Resin Art'],
        quantity: Math.max(1, Number(quantity) || 1),
        customizationRequired,
        customizationNotes: customNotes.trim() || undefined,
        expectedBudget: Number(expectedBudget) > 0 ? Number(expectedBudget) : undefined,
        priority,
        status: 'New',
        assignedUser: 'Studio Sales',
        remarks: customNotes.trim() || undefined,
      });

      const msg = `Lead ${newLead.leadNumber} for "${trimmedName}" recorded successfully!`;
      setSuccessMessage(msg);
      setToast({
        type: 'success',
        title: 'Lead Captured',
        message: msg,
      });
      setTimeout(() => {
        setQuickAction(null);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create lead:', err);
      const errMsg = err?.message || 'Failed to save lead. Please check the required fields.';
      setFormError(errMsg);
      setToast({
        type: 'error',
        title: 'Lead Capture Failed',
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // RECORD PAYMENT SUBMISSION (With Try-Catch & Loading)
  // ==========================================
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const order = orders.find((o) => o.id === selectedOrderId);
      if (!order) {
        throw new Error('Please select an active order to link this payment.');
      }
      const amt = Number(paymentAmount);
      if (!amt || amt <= 0) {
        throw new Error('Please enter a valid payment amount greater than zero.');
      }

      const payment = addPayment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        amount: amt,
        paymentDate: new Date().toISOString().split('T')[0],
        mode: paymentMode,
        transactionRef: paymentRef.trim() || `UTR-${Date.now().toString().slice(-6)}`,
        status: 'Completed',
        notes: paymentNotes.trim() || undefined,
      });

      const msg = `Payment ${payment.receiptNumber} of ${formatCurrency(amt)} recorded for Order ${order.orderNumber}!`;
      setSuccessMessage(msg);
      setToast({
        type: 'success',
        title: 'Payment Recorded',
        message: msg,
      });
      setTimeout(() => {
        setQuickAction(null);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      const errMsg = err?.message || 'Failed to record payment.';
      setFormError(errMsg);
      setToast({
        type: 'error',
        title: 'Payment Recording Failed',
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Notification Floating Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-60 max-w-sm w-full animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-900/10'
                : toast.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-900/10'
                : 'bg-amber-50/95 border-amber-200 text-amber-900 shadow-amber-900/10'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
              <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-xl w-full p-6 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              {quickAction === 'newOrder' && <ShoppingBag className="w-5 h-5 text-amber-700" />}
              {quickAction === 'newLead' && <MessageSquare className="w-5 h-5 text-amber-700" />}
              {quickAction === 'newPayment' && <CreditCard className="w-5 h-5 text-emerald-700" />}
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {quickAction === 'newLead' && 'Quick Inbound Lead Capture'}
                {quickAction === 'newPayment' && 'Record Customer Payment'}
                {quickAction === 'newOrder' && 'Create Quick Order & Customization'}
                {quickAction === 'newQuotation' && 'Create Quick Quotation'}
              </h3>
            </div>
            <button
              onClick={() => setQuickAction(null)}
              disabled={isSubmitting}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg disabled:opacity-50"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User-Friendly In-Modal Error Alert Banner */}
          {formError && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5 text-xs animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-950 mb-0.5">Please check and correct the following:</span>
                <span className="font-medium leading-relaxed">{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-500 hover:text-rose-800 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Success Message Banner with Quick Navigation */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-emerald-900 mb-0.5">Operation Successful</span>
                <span className="font-medium leading-relaxed">{successMessage}</span>
                {createdOrderRef && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAction(null);
                        setActiveTab('orders');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md text-[11px] transition-colors"
                    >
                      <span>View in Orders Tab</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1. QUICK ORDER FORM */}
          {quickAction === 'newOrder' && (
            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              {/* Quick Fill / Customer Selection Helper Header */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-stone-900 uppercase text-[10px] tracking-wider">
                    Customer Information
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFillSampleData}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      title="Quick fill test data for demo"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Auto-fill Demo</span>
                    </button>
                    <select
                      value={orderCustId}
                      onChange={(e) => handleSelectOrderCustomer(e.target.value)}
                      className="p-1 bg-white border border-stone-200 rounded text-[11px] font-medium"
                    >
                      <option value="">+ New Customer (Manual)</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.mobile})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={orderCustName}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setOrderCustName(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="e.g. Pooja Reddy"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-medium focus:ring-1 focus:ring-amber-700 outline-none disabled:bg-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Mobile / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={orderCustMobile}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setOrderCustMobile(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="+91 98490 12345"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono focus:ring-1 focus:ring-amber-700 outline-none disabled:bg-stone-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={orderCustEmail}
                      disabled={isSubmitting}
                      onChange={(e) => setOrderCustEmail(e.target.value)}
                      placeholder="e.g. pooja@example.com"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Delivery Address / City</label>
                    <input
                      type="text"
                      value={orderCustAddress}
                      disabled={isSubmitting}
                      onChange={(e) => setOrderCustAddress(e.target.value)}
                      placeholder="e.g. Banjara Hills, Hyderabad"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                    />
                  </div>
                </div>
              </div>

              {/* Product & Pricing Section */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <span className="font-bold text-stone-900 uppercase text-[10px] tracking-wider">
                  Product & Quantities
                </span>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Select Product *</label>
                  <select
                    value={orderProductId}
                    disabled={isSubmitting}
                    onChange={(e) => handleOrderProductChange(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs font-medium outline-none disabled:bg-stone-100"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Retail: ₹{p.sellingPrice} | Bulk: ₹{p.bulkPrice} (Stock: {p.stockQuantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={orderQuantity}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const q = Math.max(1, Number(e.target.value) || 1);
                        setOrderQuantity(q);
                        const tot = orderUnitPrice * q + orderCustomCharge;
                        setOrderAdvanceReceived(Math.round(tot * 0.5));
                      }}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono text-center font-bold outline-none disabled:bg-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Unit Price (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={orderUnitPrice}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const rate = Math.max(0, Number(e.target.value) || 0);
                        setOrderUnitPrice(rate);
                        const tot = rate * orderQuantity + orderCustomCharge;
                        setOrderAdvanceReceived(Math.round(tot * 0.5));
                      }}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono text-center outline-none disabled:bg-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Customization Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={orderCustomCharge}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const fee = Math.max(0, Number(e.target.value) || 0);
                        setOrderCustomCharge(fee);
                        const tot = orderUnitPrice * orderQuantity + fee;
                        setOrderAdvanceReceived(Math.round(tot * 0.5));
                      }}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono text-center outline-none disabled:bg-stone-100"
                    />
                  </div>
                </div>
              </div>

              {/* Customization Details */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  Artisan Customization Specifications
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Engraved Name / Text</label>
                    <input
                      type="text"
                      value={orderCustomText}
                      disabled={isSubmitting}
                      onChange={(e) => setOrderCustomText(e.target.value)}
                      placeholder="e.g. Sibling names, company name"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 font-medium">Color / Inlay Pigment</label>
                    <input
                      type="text"
                      value={orderCustomColor}
                      disabled={isSubmitting}
                      onChange={(e) => setOrderCustomColor(e.target.value)}
                      placeholder="e.g. Turquoise Ocean with 24K Gold"
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Artisan Instructions</label>
                  <input
                    type="text"
                    value={orderCustomNotes}
                    disabled={isSubmitting}
                    onChange={(e) => setOrderCustomNotes(e.target.value)}
                    placeholder="e.g. Food safe resin coat, dry flowers carefully..."
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                  />
                </div>
              </div>

              {/* Timeline, Order Type & Advance Payment */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Order Type</label>
                  <select
                    value={orderType}
                    disabled={isSubmitting}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                  >
                    <option value="Customized">Customized</option>
                    <option value="Retail">Retail</option>
                    <option value="Bulk">Bulk / B2B</option>
                    <option value="Corporate">Corporate Gifting</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Priority</label>
                  <select
                    value={orderPriority}
                    disabled={isSubmitting}
                    onChange={(e) => setOrderPriority(e.target.value as Priority)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                  >
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Required Delivery *</label>
                  <input
                    type="date"
                    required
                    value={orderDeliveryDate}
                    disabled={isSubmitting}
                    onChange={(e) => setOrderDeliveryDate(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono outline-none disabled:bg-stone-100"
                  />
                </div>
              </div>

              {/* Payment Summary Footer */}
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-stone-500 text-[11px]">Total Order Value:</span>
                    <div className="font-mono text-base font-bold text-stone-900">
                      {formatCurrency(orderTotalValue)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-stone-500 text-[11px]">Advance Received (₹):</span>
                    <input
                      type="number"
                      min="0"
                      max={orderTotalValue}
                      disabled={isSubmitting}
                      value={orderAdvanceReceived}
                      onChange={(e) => setOrderAdvanceReceived(Number(e.target.value) || 0)}
                      className="w-28 p-1.5 bg-white border border-stone-300 rounded font-mono font-bold text-right text-emerald-800 outline-none disabled:bg-stone-100"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-stone-200 text-stone-600">
                  <span>Remaining Balance on Delivery:</span>
                  <strong className={`font-mono ${orderBalanceAmount > 0 ? 'text-amber-900' : 'text-emerald-700'}`}>
                    {formatCurrency(orderBalanceAmount)}
                  </strong>
                </div>
              </div>

              {/* Form Action Buttons with Loading State */}
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setQuickAction(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Confirm & Create Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 2. QUICK LEAD FORM */}
          {quickAction === 'newLead' && (
            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Customer Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Ananya Roy"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Mobile / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    disabled={isSubmitting}
                    value={leadMobile}
                    onChange={(e) => setLeadMobile(e.target.value)}
                    placeholder="+91 98490 00000"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono outline-none disabled:bg-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Inquiry Source</label>
                  <select
                    value={leadSource}
                    disabled={isSubmitting}
                    onChange={(e) => setLeadSource(e.target.value as any)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                  >
                    <option value="Instagram">Instagram DM / Reel</option>
                    <option value="WhatsApp">Direct WhatsApp</option>
                    <option value="Website">Website Form</option>
                    <option value="Meesho">Meesho Store</option>
                    <option value="Referral">Client Referral</option>
                    <option value="Exhibition">Exhibition / Stall</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Priority</label>
                  <select
                    value={priority}
                    disabled={isSubmitting}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                  >
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Product of Interest</label>
                <select
                  value={productInterest}
                  disabled={isSubmitting}
                  onChange={(e) => setProductInterest(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (₹{p.sellingPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Estimated Quantity</label>
                  <input
                    type="number"
                    min="1"
                    disabled={isSubmitting}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono outline-none disabled:bg-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Budget Target (₹)</label>
                  <input
                    type="number"
                    disabled={isSubmitting}
                    value={expectedBudget}
                    onChange={(e) => setExpectedBudget(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono outline-none disabled:bg-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Customization & Notes</label>
                <textarea
                  rows={2}
                  disabled={isSubmitting}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Names to engrave, flower colors, deadline details..."
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setQuickAction(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Lead...</span>
                    </>
                  ) : (
                    <span>Save Lead</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 3. RECORD PAYMENT FORM */}
          {quickAction === 'newPayment' && (
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-medium">Link to Active Order *</label>
                <select
                  value={selectedOrderId}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    const foundOrd = orders.find((o) => o.id === e.target.value);
                    if (foundOrd) {
                      setPaymentAmount(foundOrd.balanceAmount > 0 ? foundOrd.balanceAmount : foundOrd.totalValue);
                    }
                  }}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName} (Bal: ₹{o.balanceAmount} / Total: ₹{o.totalValue})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Amount Received (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={isSubmitting}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold outline-none disabled:bg-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Payment Mode</label>
                  <select
                    value={paymentMode}
                    disabled={isSubmitting}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                  >
                    <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash at Studio</option>
                    <option value="Card">Card / POS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Transaction UTR / Reference</label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="UTR / Reference Number"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono outline-none disabled:bg-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-medium">Notes</label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. 50% advance for customized order"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none disabled:bg-stone-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setQuickAction(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Payment</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 4. QUICK QUOTATION ACTION */}
          {quickAction === 'newQuotation' && (
            <div className="text-center py-6 space-y-4">
              <p className="text-xs text-stone-600">
                Opening the full Quotation Builder to allow customized line items, GST taxation, and branded PDF generation.
              </p>
              <button
                onClick={() => {
                  setQuickAction(null);
                  setActiveTab('quotations');
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs cursor-pointer"
              >
                Go to Quotations Builder
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
