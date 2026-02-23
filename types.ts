// Define Id type manually to avoid dependency on generated files
export type Id<TableName extends string> = string;

export enum PartnerType {
  DEALER = 'DEALER',
  TRADER = 'TRADER'
}

export enum PromotionType {
  PROMO = 'PROMO',
  PRICE_DROP = 'PRICE_DROP'
}

export type PaymentStatus = 'UNPAID' | 'PAID';

export type UserRole = 'ADMIN' | 'PARTNER';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added for local storage management
  role: UserRole;
  partnerId?: string; // Only if role is PARTNER
}

export interface SKU {
  _id: Id<"skus">;
  code: string;
  name: string;
  category: string;
  originalPrice: number;
  _creationTime: number;
}

export interface Partner {
  _id: Id<"partners">;
  name: string;
  type: PartnerType;
  email: string;
  country: string;
  discountRate?: number; // The discount rate for Dealers (percentage)
  _creationTime: number;
}

export interface PromotionItem {
  skuId: string; // Storing the ID as string reference
  promoPrice: number;
  rebateAmount: number; // Changed from percentage to fixed compensation amount
}

export interface Promotion {
  _id: Id<"promotions">;
  name: string;
  type: PromotionType; // Added type
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  items: PromotionItem[];
  description: string;
  _creationTime: number;
}

export interface SalesReport {
  _id: Id<"sales">;
  promotionId: string;
  partnerId: string;
  skuId: string;
  quantitySold: number;
  claimPercentage: number; // For Dealers: The Discount Rate used. For Traders: 100.
  submittedAt: string;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  paymentReference?: string;
  _creationTime: number;
}

// Helper type for the rebate view
export interface RebateCalculation {
  reportId: string;
  partnerName: string;
  partnerType: PartnerType;
  skuCode: string;
  skuName: string;
  originalPrice: number;
  promoPrice: number;
  quantitySold: number;
  rebatePerUnit: number; // The calculated rebate unit value
  claimPercentage: number; // The rate used for calculation
  effectiveRebate: number; // Same as rebatePerUnit (kept for compatibility)
  totalRebate: number;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  paymentReference?: string;
}