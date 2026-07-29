import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Loader2, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import api from "../api"
import type { StripeCardFormProps } from "../types/stripe"

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "")

function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥",
    AUD: "A$", CAD: "C$", CHF: "CHF", CNY: "¥", KRW: "₩",
  }
  return symbols[currencyCode?.toUpperCase()] || "$"
}

function StripeCardFormInner({ refNumber, amount, hotelName: _hotelName, guestName, guestEmail, guestPhone, onSuccess }: StripeCardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingIntent, setLoadingIntent] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const CUR = getCurrencySymbol("USD")

  useEffect(() => {
    if (!refNumber) return
    let cancelled = false
    const createIntent = async () => {
      setLoadingIntent(true)
      setError(null)
      try {
        const { data } = await api.post(`/bookings/${refNumber}/payment-intent`, { payment_gateway: "stripe" })
        if (cancelled) return
        const secret = data?.client_secret || data?.data?.client_secret
        if (!secret) {
          setError("Failed to initialize payment")
          return
        }
        setClientSecret(secret)
      } catch (err: unknown) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : "Failed to initialize payment"
        setError(msg)
      } finally {
        if (!cancelled) setLoadingIntent(false)
      }
    }
    createIntent()
    return () => { cancelled = true }
  }, [refNumber])

  const handleConfirmPayment = async () => {
    if (!stripe || !elements || !clientSecret) return
    setLoading(true)
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: guestName || "",
            email: guestEmail || "",
            phone: guestPhone || "",
          },
        },
      })
      if (stripeError) {
        toast.error(stripeError.message || "Payment failed")
      } else if (paymentIntent?.status === "succeeded") {
        toast.success("Payment successful!")
        onSuccess(paymentIntent.id, clientSecret)
      } else {
        toast.error("Payment was not completed")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (loadingIntent) {
    return (
      <div className="flex items-center justify-center gap-2 py-6">
        <Loader2 size={16} className="animate-spin text-[#0071c2]" />
        <span className="text-sm text-gray-500">Initializing payment...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-500 mb-2">{error}</p>
        <button
          onClick={() => { setError(null); setLoadingIntent(true); /* retry by remounting */ }}
          className="text-sm text-[#0071c2] font-semibold hover:underline cursor-pointer"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!clientSecret) return null

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl p-4">
        <label className="block text-xs font-semibold text-gray-700 mb-2">Card Details</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "14px",
                color: "#1a1a1a",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
          className="bg-white border border-gray-300 rounded-lg p-3"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {["Visa", "Mastercard", "Amex", "Discover"].map((b) => (
          <span key={b} className="text-[10px] font-medium bg-white border border-gray-200 rounded px-2 py-1 text-gray-600">{b}</span>
        ))}
      </div>
      <button
        disabled={loading || !stripe}
        onClick={handleConfirmPayment}
        className="w-full py-2.5 rounded-lg bg-[#0071c2] text-white text-sm font-semibold hover:bg-[#005fa3] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 size={14} className="animate-spin" /> Processing...</>
        ) : (
          <>Pay {CUR}{Math.max(0, amount).toFixed(2)} via Card</>
        )}
      </button>
    </div>
  )
}

export default function StripeCardForm(props: StripeCardFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <div className="space-y-4">
        <StripeCardFormInner {...props} />
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Secure Payment via Stripe</p>
            <p className="text-xs text-gray-600">Your card details are encrypted. We never store card details.</p>
          </div>
        </div>
      </div>
    </Elements>
  )
}
