export interface CreditPackage {
  id: 'starter' | 'popular' | 'premium' | 'whale'
  name: string
  credits: number
  bonusCredits: number
  totalCredits: number
  usdAmount: number
  popular?: boolean
}

export interface UserCredits {
  balance: number
  totalPurchased: number
  totalUsed: number
}

export interface CreditUsage {
  coinSymbol: string
  featureType: string
  creditsUsed: number
  createdAt: string
}

export interface CreditPurchase {
  id: string
  packageType: string
  totalCredits: number
  usdAmount: number
  cryptoCurrency: string
  paymentStatus: string
  createdAt: string
}

export interface PaymentRequest {
  price_amount: number
  price_currency: string
  pay_currency: string
  order_id: string
  order_description: string
  ipn_callback_url: string
  success_url: string
  cancel_url: string
}

export interface PaymentResponse {
  payment_id: string
  payment_status: string
  pay_address: string
  pay_amount: number
  pay_currency: string
  price_amount: number
  price_currency: string
  order_id: string
  order_description: string
  created_at: string
}