import express from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const razorpay = new Razorpay({
  key_id: 'rzp_test_THG2PBUwAQ3U9c',
  key_secret: 'ND377Ai9cN0rv8Q1lI0T7KVs',
})

const KEY_SECRET = 'ND377Ai9cN0rv8Q1lI0T7KVs'
const BACKEND_URL = 'https://stay-easy-sizw.onrender.com'

app.post('/api/v1/payments/create-order', async (req, res) => {
  try {
    const { amount, hotelId } = req.body
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${hotelId}_${Date.now()}`,
    }
    const order = await razorpay.orders.create(options)
    res.json({
      orderId: order.id,
      amount: Number(order.amount) / 100,
      currency: order.currency,
    })
  } catch (err) {
    console.error('Create order error:', err)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

app.post('/api/v1/payments/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(body)
      .digest('hex')
    const isValid = expectedSignature === razorpay_signature
    if (isValid) {
      res.json({ success: true })
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' })
    }
  } catch (err) {
    console.error('Verify error:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
})

app.all('/api/{*path}', async (req, res) => {
  try {
    const url = `${BACKEND_URL}${req.originalUrl}`
    const headers = {}
    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization
    }
    const fetchOptions = {
      method: req.method,
      headers: { ...headers, 'Content-Type': 'application/json' },
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body)
    }
    const response = await fetch(url, fetchOptions)
    const data = await response.text()
    res.status(response.status).set('Content-Type', response.headers.get('content-type') || 'application/json').send(data)
  } catch (err) {
    console.error('Proxy error:', err)
    res.status(502).json({ error: 'Backend unreachable' })
  }
})

const PORT = 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
