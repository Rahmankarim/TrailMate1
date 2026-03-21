// JazzCash Payment Integration
// Add your JazzCash API credentials in .env.local:
// JAZZCASH_MERCHANT_ID=your_merchant_id
// JAZZCASH_PASSWORD=your_password
// JAZZCASH_INTEGRITY_SALT=your_integrity_salt
// JAZZCASH_ENVIRONMENT=sandbox (or production)

import crypto from 'crypto'

interface JazzCashConfig {
  merchantId: string
  password: string
  integritySalt: string
  environment: 'sandbox' | 'production'
  baseUrl: string
}

interface PaymentData {
  amount: number
  currency: string
  bookingId: string
  userId: string
  guideId: string
  description: string
}

interface PaymentResponse {
  success: boolean
  transactionId?: string
  paymentUrl?: string
  error?: string
}

class JazzCashService {
  private config: JazzCashConfig

  constructor() {
    const environment = (process.env.JAZZCASH_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'
    
    this.config = {
      merchantId: process.env.JAZZCASH_MERCHANT_ID || 'mock_merchant_id',
      password: process.env.JAZZCASH_PASSWORD || 'mock_password',
      integritySalt: process.env.JAZZCASH_INTEGRITY_SALT || 'mock_salt',
      environment,
      baseUrl: environment === 'sandbox' 
        ? 'https://sandbox.jazzcash.com.pk' 
        : 'https://payments.jazzcash.com.pk'
    }
  }

  private generateSecureHash(data: Record<string, string>): string {
    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort()
    
    // Create string with IntegritySalt at start
    let hashString = this.config.integritySalt + '&'
    
    // Add sorted values
    sortedKeys.forEach(key => {
      if (data[key] !== '') {
        hashString += data[key] + '&'
      }
    })
    
    // Remove trailing '&'
    hashString = hashString.slice(0, -1)
    
    // Generate SHA256 hash
    return crypto.createHash('sha256').update(hashString).digest('hex')
  }

  async createPayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      // Mock implementation - No API credentials needed for development
      if (this.config.merchantId === 'mock_merchant_id') {
        console.log('🎵 Using mock JazzCash service (development mode)')
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return {
          success: true,
          transactionId: `JC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          paymentUrl: `/payment/process?bookingId=${data.bookingId}&amount=${data.amount}`
        }
      }

      // Real JazzCash API implementation
      const txnDateTime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
      const txnExpiryDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString().replace(/[-:]/g, '').split('.')[0]
      
      const txnRefNumber = `TXN_${data.bookingId}_${Date.now()}`
      
      const paymentParams: Record<string, string> = {
        pp_Version: '1.1',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: this.config.merchantId,
        pp_Password: this.config.password,
        pp_TxnRefNo: txnRefNumber,
        pp_Amount: (data.amount * 100).toString(), // JazzCash uses paisa (smallest unit)
        pp_TxnCurrency: data.currency,
        pp_TxnDateTime: txnDateTime,
        pp_BillReference: data.bookingId,
        pp_Description: data.description,
        pp_TxnExpiryDateTime: txnExpiryDateTime,
        pp_ReturnURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/jazzcash-callback`,
        pp_SecureHash: ''
      }

      // Generate secure hash
      const secureHash = this.generateSecureHash(paymentParams)
      paymentParams.pp_SecureHash = secureHash

      // Create form data
      const formData = new URLSearchParams(paymentParams)

      const response = await fetch(`${this.config.baseUrl}/CustomerPortal/transactionmanagement/merchantform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      })

      if (!response.ok) {
        throw new Error('JazzCash payment creation failed')
      }

      // JazzCash redirects to payment page
      return {
        success: true,
        transactionId: txnRefNumber,
        paymentUrl: response.url
      }
    } catch (error) {
      console.error('JazzCash payment error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      }
    }
  }

  async verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }> {
    try {
      // Mock implementation
      if (this.config.merchantId === 'mock_merchant_id') {
        console.log('🎵 Verifying payment (mock mode)')
        await new Promise(resolve => setTimeout(resolve, 500))
        return {
          verified: true,
          status: 'completed'
        }
      }

      // Real JazzCash API implementation - Inquiry Transaction
      const txnDateTime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
      
      const inquiryParams: Record<string, string> = {
        pp_Version: '1.1',
        pp_TxnType: 'INQUIRY',
        pp_Language: 'EN',
        pp_MerchantID: this.config.merchantId,
        pp_Password: this.config.password,
        pp_TxnRefNo: transactionId,
        pp_TxnDateTime: txnDateTime,
        pp_SecureHash: ''
      }

      // Generate secure hash
      const secureHash = this.generateSecureHash(inquiryParams)
      inquiryParams.pp_SecureHash = secureHash

      const formData = new URLSearchParams(inquiryParams)

      const response = await fetch(`${this.config.baseUrl}/CustomerPortal/transactionmanagement/merchantform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      })

      if (!response.ok) {
        throw new Error('Payment verification failed')
      }

      const result = await response.text()
      
      // Parse JazzCash response
      const responseParams = new URLSearchParams(result)
      const responseCode = responseParams.get('pp_ResponseCode')
      
      return {
        verified: responseCode === '000', // 000 means success in JazzCash
        status: responseCode === '000' ? 'completed' : 'failed'
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        verified: false,
        status: 'failed'
      }
    }
  }

  async processRefund(transactionId: string, amount: number): Promise<PaymentResponse> {
    try {
      // Mock implementation
      if (this.config.merchantId === 'mock_merchant_id') {
        console.log('🎵 Processing refund (mock mode)')
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {
          success: true,
          transactionId: `REFUND_${transactionId}`
        }
      }

      // Real JazzCash API implementation - Refund Transaction
      const txnDateTime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
      const refundRefNo = `REFUND_${transactionId}_${Date.now()}`
      
      const refundParams: Record<string, string> = {
        pp_Version: '1.1',
        pp_TxnType: 'REFUND',
        pp_Language: 'EN',
        pp_MerchantID: this.config.merchantId,
        pp_Password: this.config.password,
        pp_TxnRefNo: refundRefNo,
        pp_Amount: (amount * 100).toString(), // Convert to paisa
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: txnDateTime,
        pp_OriginalTxnRefNo: transactionId,
        pp_SecureHash: ''
      }

      // Generate secure hash
      const secureHash = this.generateSecureHash(refundParams)
      refundParams.pp_SecureHash = secureHash

      const formData = new URLSearchParams(refundParams)

      const response = await fetch(`${this.config.baseUrl}/CustomerPortal/transactionmanagement/merchantform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      })

      if (!response.ok) {
        throw new Error('Refund failed')
      }

      const result = await response.text()
      const responseParams = new URLSearchParams(result)
      const responseCode = responseParams.get('pp_ResponseCode')
      
      return {
        success: responseCode === '000',
        transactionId: responseCode === '000' ? refundRefNo : undefined,
        error: responseCode !== '000' ? 'Refund failed' : undefined
      }
    } catch (error) {
      console.error('Refund error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed'
      }
    }
  }
}

export const jazzCashService = new JazzCashService()
export type { PaymentData, PaymentResponse }
