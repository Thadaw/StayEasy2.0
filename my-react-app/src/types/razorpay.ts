export interface RazorpayOrderResponse {
  orderId: string
  amount: number
  currency: string
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id?: string
  handler: (response: RazorpayPaymentResponse) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
  config?: {
    display?: Record<string, unknown>
  }
}

export interface HostBankDetails {
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  upiId?: string
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => { open: () => void }
  }
}
