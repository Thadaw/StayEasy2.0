export interface StripePaymentIntentResponse {
  client_secret: string
  amount: number
  currency: string
  payment_intent_id?: string
}

export interface StripeCardFormProps {
  refNumber: string
  amount: number
  hotelName: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  onSuccess: (paymentIntentId: string, clientSecret: string) => void
}
