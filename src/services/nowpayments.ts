import { supabase } from '../config/supabase'
import type { CreditPackage, PaymentRequest, PaymentResponse } from '../types/credits'

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 20,
    bonusCredits: 0,
    totalCredits: 20,
    usdAmount: 5.0,
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 40,
    bonusCredits: 10,
    totalCredits: 50,
    usdAmount: 10.0,
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    credits: 80,
    bonusCredits: 20,
    totalCredits: 100,
    usdAmount: 20.0,
  },
  {
    id: 'whale',
    name: 'Whale',
    credits: 200,
    bonusCredits: 50,
    totalCredits: 250,
    usdAmount: 50.0,
  },
]

export class NOWPaymentsService {
  private apiKey: string
  public baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_NOWPAYMENTS_API_KEY
    this.baseUrl =
      import.meta.env.VITE_NOWPAYMENTS_ENVIRONMENT === 'production'
        ? 'https://api.nowpayments.io/v1'
        : 'https://api-sandbox.nowpayments.io/v1'
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        `NOWPayments API error: ${error.message || response.statusText}`
      )
    }

    return response.json()
  }

  async getAvailableCurrencies(): Promise<string[]> {
    const data = await this.makeRequest('/currencies')
    return data.currencies
  }

  async getMinimumPaymentAmount(currency: string): Promise<number> {
    const data = await this.makeRequest(
      `/min-amount?currency_from=${currency}&currency_to=usd`
    )
    return data.min_amount
  }

  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    return this.makeRequest('/payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    return this.makeRequest(`/payment/${paymentId}`)
  }

  async createCreditPurchase(
    userId: string,
    packageId: string,
    payCurrency: string = 'btc'
  ): Promise<PaymentResponse> {
    const package_ = CREDIT_PACKAGES.find((p) => p.id === packageId)
    if (!package_) {
      throw new Error('Invalid package ID')
    }

    // Check minimum payment amount
    const minAmount = await this.getMinimumPaymentAmount(payCurrency)
    if (package_.usdAmount < minAmount) {
      throw new Error(
        `Minimum payment amount for ${payCurrency} is $${minAmount}`
      )
    }

    const orderId = `credit_${userId}_${Date.now()}`

    // Store pending purchase in database
    if (supabase) {
      const { error } = await supabase.from('credit_purchases').insert({
        user_id: userId,
        package_type: packageId,
        credits_purchased: package_.credits,
        bonus_credits: package_.bonusCredits,
        total_credits: package_.totalCredits,
        usd_amount: package_.usdAmount,
        crypto_currency: payCurrency.toUpperCase(),
        crypto_amount: 0, // Will be updated by webhook
        nowpayments_payment_id: orderId, // Temporary, will be updated
        payment_status: 'pending',
      })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    }

    const paymentData: PaymentRequest = {
      price_amount: package_.usdAmount,
      price_currency: 'usd',
      pay_currency: payCurrency,
      order_id: orderId,
      order_description: `TradeInsight ${package_.name} Package - ${package_.totalCredits} credits`,
      ipn_callback_url: `${window.location.origin}/api/nowpayments/webhook`,
      success_url: `${window.location.origin}/credits/success`,
      cancel_url: `${window.location.origin}/credits/cancel`,
    }

    const payment = await this.createPayment(paymentData)

    // Update database with actual payment ID
    if (supabase) {
      await supabase
        .from('credit_purchases')
        .update({
          nowpayments_payment_id: payment.payment_id,
          crypto_amount: payment.pay_amount,
          payment_address: payment.pay_address,
        })
        .eq('nowpayments_payment_id', orderId)
    }

    return payment
  }
}

export const nowPaymentsService = new NOWPaymentsService()