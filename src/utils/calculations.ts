import { Product, ProductCosting } from '../types.ts';

/**
 * Central Product Costing & Margin Engine
 */
export function calculateProductCost(costing: ProductCosting): number {
  return (
    (costing.rawMaterial || 0) +
    (costing.labour || 0) +
    (costing.packaging || 0) +
    (costing.other || 0)
  );
}

export function calculateGrossProfit(sellingPrice: number, totalCost: number): number {
  return sellingPrice - totalCost;
}

export function calculateGrossMarginPercent(sellingPrice: number, totalCost: number): number {
  if (!sellingPrice || sellingPrice <= 0) return 0;
  return Number((((sellingPrice - totalCost) / sellingPrice) * 100).toFixed(1));
}

/**
 * Central Quotation & Order Pricing Engine
 */
export interface CalculationInput {
  items: Array<{
    quantity: number;
    unitPrice: number;
    customizationCharge?: number;
  }>;
  discountAmount?: number;
  packagingCharge?: number;
  shippingCharge?: number;
  gstRatePercent?: number;
  advancePercentage?: number;
}

export interface CalculationResult {
  itemsSubtotal: number;
  totalCustomization: number;
  subtotalBeforeDiscount: number;
  discountAmount: number;
  packagingCharge: number;
  shippingCharge: number;
  taxableSubtotal: number;
  gstRatePercent: number;
  gstAmount: number;
  grandTotal: number;
  advanceRequired: number;
  balanceAmount: number;
}

export function calculateQuotationTotals(input: CalculationInput): CalculationResult {
  let itemsSubtotal = 0;
  let totalCustomization = 0;

  for (const item of input.items) {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const customCharge = Number(item.customizationCharge) || 0;

    itemsSubtotal += qty * price;
    totalCustomization += customCharge;
  }

  const discountAmount = Math.max(0, Number(input.discountAmount) || 0);
  const packagingCharge = Math.max(0, Number(input.packagingCharge) || 0);
  const shippingCharge = Math.max(0, Number(input.shippingCharge) || 0);

  const subtotalBeforeDiscount = itemsSubtotal + totalCustomization;
  const taxableSubtotal = Math.max(0, subtotalBeforeDiscount - discountAmount + packagingCharge + shippingCharge);

  const gstRatePercent = Number(input.gstRatePercent) || 0;
  const gstAmount = Number(((taxableSubtotal * gstRatePercent) / 100).toFixed(2));
  const grandTotal = Number((taxableSubtotal + gstAmount).toFixed(2));

  const advancePct = input.advancePercentage !== undefined ? input.advancePercentage : 50;
  const advanceRequired = Number(((grandTotal * advancePct) / 100).toFixed(2));
  const balanceAmount = Number((grandTotal - advanceRequired).toFixed(2));

  return {
    itemsSubtotal,
    totalCustomization,
    subtotalBeforeDiscount,
    discountAmount,
    packagingCharge,
    shippingCharge,
    taxableSubtotal,
    gstRatePercent,
    gstAmount,
    grandTotal,
    advanceRequired,
    balanceAmount,
  };
}

/**
 * Currency Formatter for Indian Rupee
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Production balance calculation
 */
export function calculateBalanceQty(required: number, produced: number, rejected: number): number {
  return Math.max(0, required - (produced + rejected));
}
