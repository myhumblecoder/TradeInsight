import { supabase } from '../config/supabase'
import type { UserCredits, CreditUsage, CreditPurchase } from '../types/credits'

export class CreditService {
  async getUserCredits(userId: string): Promise<UserCredits | null> {
    if (!supabase) {
      return { balance: 0, totalPurchased: 0, totalUsed: 0 }
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, total_purchased, total_used')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // Not found error
      throw new Error(`Error fetching credits: ${error.message}`)
    }

    return data ? {
      balance: data.balance,
      totalPurchased: data.total_purchased,
      totalUsed: data.total_used,
    } : { balance: 0, totalPurchased: 0, totalUsed: 0 }
  }

  async useCredits(
    userId: string,
    coinSymbol: string,
    featureType: string = 'analysis',
    creditsToUse: number = 1
  ): Promise<boolean> {
    const credits = await this.getUserCredits(userId)

    if (!credits || credits.balance < creditsToUse) {
      throw new Error('Insufficient credits')
    }

    if (!supabase) {
      return true // In test/development mode without Supabase
    }

    const { error } = await supabase.from('credit_usage').insert({
      user_id: userId,
      coin_symbol: coinSymbol,
      feature_type: featureType,
      credits_used: creditsToUse,
    })

    if (error) {
      throw new Error(`Error using credits: ${error.message}`)
    }

    return true
  }

  async getCreditHistory(
    userId: string,
    limit: number = 50
  ): Promise<{
    purchases: CreditPurchase[]
    usage: CreditUsage[]
  }> {
    if (!supabase) {
      return { purchases: [], usage: [] }
    }

    const [purchaseResult, usageResult] = await Promise.all([
      supabase
        .from('credit_purchases')
        .select(
          'id, package_type, total_credits, usd_amount, crypto_currency, payment_status, created_at'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),

      supabase
        .from('credit_usage')
        .select('coin_symbol, feature_type, credits_used, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
    ])

    if (purchaseResult.error) {
      throw new Error(
        `Error fetching purchase history: ${purchaseResult.error.message}`
      )
    }

    if (usageResult.error) {
      throw new Error(
        `Error fetching usage history: ${usageResult.error.message}`
      )
    }

    return {
      purchases: purchaseResult.data.map((p) => ({
        id: p.id,
        packageType: p.package_type,
        totalCredits: p.total_credits,
        usdAmount: p.usd_amount,
        cryptoCurrency: p.crypto_currency,
        paymentStatus: p.payment_status,
        createdAt: p.created_at,
      })),
      usage: usageResult.data.map((u) => ({
        coinSymbol: u.coin_symbol,
        featureType: u.feature_type,
        creditsUsed: u.credits_used,
        createdAt: u.created_at,
      })),
    }
  }

  async hasCreditsForFeature(
    userId: string,
    requiredCredits: number = 1
  ): Promise<boolean> {
    const credits = await this.getUserCredits(userId)
    return credits ? credits.balance >= requiredCredits : false
  }

  // Webhook handler for NOWPayments
  async handlePaymentWebhook(
    webhookData: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { payment_id, payment_status } = webhookData

      if (!supabase) {
        return { success: true, message: 'Webhook processed (no database)' }
      }

      if (payment_status === 'finished') {
        // Payment completed - activate credits
        const { error } = await supabase
          .from('credit_purchases')
          .update({
            payment_status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('nowpayments_payment_id', payment_id)

        if (error) {
          return { success: false, message: `Database error: ${error.message}` }
        }

        return { success: true, message: 'Credits activated successfully' }
      } else if (payment_status === 'failed' || payment_status === 'expired') {
        // Payment failed - mark as failed
        await supabase
          .from('credit_purchases')
          .update({ payment_status: payment_status })
          .eq('nowpayments_payment_id', payment_id)

        return { success: true, message: `Payment ${payment_status}` }
      }

      return { success: true, message: 'Webhook processed' }
    } catch (error) {
      console.error('Webhook processing error:', error)
      return {
        success: false,
        message: `Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }
}

export const creditService = new CreditService()