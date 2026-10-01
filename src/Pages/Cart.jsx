import { useEffect, useState } from "react";
import { useCart } from "../Context/CartContext";
import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { formatINR } from "../utils/currency";
const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve(true)
    return
  }

  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.onload = () => resolve(true)
  script.onerror = () => reject(new Error('Could not load secure payment checkout.'))
  document.body.appendChild(script)
})


const Cart = () => {
  const { cart, setCart, increaseQty, removeItem, decreaseQty } = useCart();
  const api_url = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token')
  const location = useLocation()
  const buyNowProduct = location.state?.buyNowProduct || null
  const checkoutItems = buyNowProduct ? [{ ...buyNowProduct, qty: 1 }] : cart
  const [address, setAddress] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      return {
        label: 'Home',
        name: user?.address?.name || user?.name || '',
        phone: user?.address?.phone || user?.phone || '',
        addressLine: user?.address?.addressLine || '',
        landmark: user?.address?.landmark || '',
        pincode: user?.address?.pincode || '',
        city: user?.address?.city || ''
      }
    } catch {
      return { name: '', phone: '', addressLine: '', landmark: '', pincode: '', city: '' }
    }
  })
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true)
  const [paymentType, setPaymentType] = useState('COD')
  const [showCheckout, setShowCheckout] = useState(Boolean(buyNowProduct))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const total = checkoutItems.reduce((sum, item) => sum + Number(item.price) * item.qty, 0)

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()
    axios.get(`${api_url}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    }).then(({ data }) => {
      const addresses = data.user.addresses || []
      setSavedAddresses(addresses)

      const preferredAddress = addresses.find((item) => item.isDefault) || addresses[0]
      if (preferredAddress) {
        setSelectedAddressId(preferredAddress._id)
        setIsAddingAddress(false)
        setAddress({ ...preferredAddress })
      } else {
        setIsAddingAddress(true)
        setAddress((current) => ({
          ...current,
          name: data.user.name || current.name,
          phone: data.user.phone || current.phone
        }))
      }
    }).catch((error) => {
      if (!axios.isCancel(error)) {
        setErrorMessage(error.response?.data?.message || 'Could not load saved addresses.')
      }
    })

    return () => controller.abort()
  }, [api_url, token])

  const selectSavedAddress = (savedAddress) => {
    setSelectedAddressId(savedAddress._id)
    setIsAddingAddress(false)
    setAddress({ ...savedAddress })
  }

  const startAddingAddress = () => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null')
      } catch {
        return null
      }
    })()
    setSelectedAddressId('')
    setAddress({
      label: 'Home',
      name: user?.name || '',
      phone: user?.phone || '',
      addressLine: '',
      landmark: '',
      pincode: '',
      city: '',
      isDefault: false
    })
    setSaveAddressToProfile(true)
    setIsAddingAddress(true)
  }

  const createOrder = async (event) => {
    event.preventDefault()
    if (!token) {
      setErrorMessage('Please log in or create an account before placing your order.')
      navigate('/login')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    let waitingForPayment = false
    try {
      const headers = { Authorization: `Bearer ${token}` }
      if (isAddingAddress && saveAddressToProfile) {
        const { data } = await axios.post(
          `${api_url}/api/user/addresses`,
          { ...address, isDefault: savedAddresses.length === 0 || address.isDefault },
          { headers }
        )
        setSavedAddresses(data.user.addresses || [])
        setSelectedAddressId(data.address?._id || '')
        setIsAddingAddress(false)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      const orderData = {
        items: checkoutItems.map((item) => ({
          productId: item._id,
          qty: item.qty
        })),
        address
      }

      if (paymentType === 'COD') {
        const res = await axios.post(`${api_url}/api/order/create-order`, { ...orderData, paymentType: 'COD' }, { headers })
        if (!buyNowProduct) setCart([])
        alert(`${res.data.message}. Order total: ${formatINR(res.data.totalAmount)}`)
        navigate('/')
        return
      }

      await loadRazorpay()
      const { data: paymentOrder } = await axios.post(`${api_url}/api/order/payment/create`, orderData, { headers })
      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: paymentOrder.merchantName,
        description: 'Medicine order',
        order_id: paymentOrder.gatewayOrderId,
        prefill: { name: address.name, contact: address.phone },
        notes: { storeOrderId: paymentOrder.orderId },
        theme: { color: '#0e8574' },
        handler: async (paymentResult) => {
          setIsSubmitting(true)
          try {
            const { data } = await axios.post(`${api_url}/api/order/payment/verify`, {
              orderId: paymentOrder.orderId,
              ...paymentResult
            }, { headers })
            if (!buyNowProduct) setCart([])
            alert(`${data.message}. Order total: ${formatINR(data.totalAmount)}`)
            navigate('/')
          } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Payment verification failed. Contact support before retrying.')
          } finally {
            setIsSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => setIsSubmitting(false)
        }
      })

      checkout.on('payment.failed', (event) => {
        setErrorMessage(event.error?.description || 'Payment failed. You can retry or choose Cash on Delivery.')
        setIsSubmitting(false)
      })
      waitingForPayment = true
      checkout.open()
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Order failed. Please try again.')
    } finally {
      if (!waitingForPayment) setIsSubmitting(false)
    }
  }

  return (
    <div className="cart-container">
      {checkoutItems.length === 0 ? (
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <button onClick={() => navigate('/')} className="place-order">Continue Shopping</button>
        </div>
      ) : (
        <>
          {checkoutItems.map((item) => (
            <div className="cart-card" key={item._id}>
              <img src={item.images?.[0]?.url || 'https://images.unsplash.com/...'} alt={item.productName} className="cart-image" />

              <div className="cart-details">
                <h3 className="cart-title">{item.productName}</h3>
                <p>Price: {formatINR(item.price)}</p>
                <p>Qty: {item.qty}</p>

                {!buyNowProduct && (
                  <>
                    <div className="cart-quantity-box">
                      <button className="cart-btn" onClick={() => decreaseQty(item._id)}>-</button>
                      <button className="cart-btn" onClick={() => increaseQty(item._id)}>+</button>
                    </div>
                    <button className="cart-remove-btn" onClick={() => removeItem(item._id)}>Remove</button>
                  </>
                )}
              </div>
            </div>
          ))}

          {!showCheckout ? (
            <section className="cart-summary-panel">
              <div>
                <h2>Cart total</h2>
                <p className="checkout-total">{formatINR(total)}</p>
              </div>
              <button
                type="button"
                className="place-order"
                onClick={() => {
                  if (!token) {
                    navigate('/login')
                    return
                  }
                  setShowCheckout(true)
                }}
              >
                Proceed to checkout
              </button>
            </section>
          ) : (
            <>
              <button
                type="button"
                className="back-to-cart"
                onClick={() => buyNowProduct ? navigate(`/product/${buyNowProduct._id}`) : setShowCheckout(false)}
              >
                {buyNowProduct ? 'Back to product' : 'Back to cart'}
              </button>
              <form className="checkout-panel" onSubmit={createOrder}>
            <h2>Delivery details</h2>
            <p className="checkout-total">Cart estimate: {formatINR(total)}</p>
            <div className="checkout-address-book">
              <div className="checkout-address-heading">
                <h3>Choose delivery address</h3>
                <button
                  type="button"
                  className="checkout-add-address"
                  onClick={() => {
                    if (!isAddingAddress) {
                      startAddingAddress()
                      return
                    }
                    const preferred = savedAddresses.find((item) => item._id === selectedAddressId) || savedAddresses.find((item) => item.isDefault) || savedAddresses[0]
                    if (preferred) selectSavedAddress(preferred)
                    else setIsAddingAddress(false)
                  }}
                >
                  {isAddingAddress ? 'Choose a saved address' : '+ Add new address'}
                </button>
              </div>

              {savedAddresses.length > 0 && (
                <div className="checkout-saved-addresses">
                  {savedAddresses.map((savedAddress) => (
                    <label className={`checkout-saved-address ${selectedAddressId === savedAddress._id && !isAddingAddress ? 'is-selected' : ''}`} key={savedAddress._id}>
                      <input
                        type="radio"
                        name="deliveryAddress"
                        checked={selectedAddressId === savedAddress._id && !isAddingAddress}
                        onChange={() => selectSavedAddress(savedAddress)}
                      />
                      <span className="checkout-saved-address-copy">
                        <strong>{savedAddress.label}{savedAddress.isDefault ? ' · Default' : ''}</strong>
                        <span>{savedAddress.name} · +91 {savedAddress.phone}</span>
                        <span>{savedAddress.addressLine}, {savedAddress.city} {savedAddress.pincode}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {isAddingAddress && (
                <>
                  <div className="checkout-fields">
                    <label>Save address as
                      <select required value={address.label || 'Home'} onChange={(e) => setAddress({ ...address, label: e.target.value })}>
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                    <label>Full name
                      <input autoComplete="name" maxLength={100} required value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
                    </label>
                    <label>Mobile number
                      <input type="tel" autoComplete="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} minLength={10} placeholder="10-digit mobile number" required value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </label>
                    <label>City
                      <select required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}>
                        <option value="">Choose delivery city</option>
                        <option value="Lucknow">Lucknow</option>
                        <option value="Azamgarh">Azamgarh</option>
                        <option value="Kanpur">Kanpur</option>
                        <option value="Gorakhpur">Gorakhpur</option>
                      </select>
                    </label>
                    <label className="checkout-wide">House, street, area
                      <textarea autoComplete="street-address" minLength={5} maxLength={250} required value={address.addressLine} onChange={(e) => setAddress({ ...address, addressLine: e.target.value })} />
                    </label>
                    <label>Landmark <span className="optional-label">Optional</span>
                      <input maxLength={120} value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
                    </label>
                    <label>PIN code
                      <input inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} minLength={6} autoComplete="postal-code" required value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
                    </label>
                  </div>
                  <label className="checkout-save-address">
                    <input type="checkbox" checked={saveAddressToProfile} onChange={(e) => setSaveAddressToProfile(e.target.checked)} />
                    <span>Save this address to my profile</span>
                  </label>
                </>
              )}
            </div>
            <fieldset className="payment-options">
              <legend>Payment method</legend>
              <label><input type="radio" name="paymentType" value="COD" checked={paymentType === 'COD'} onChange={() => setPaymentType('COD')} /> Cash on Delivery</label>
              <label><input type="radio" name="paymentType" value="Razorpay" checked={paymentType === 'Razorpay'} onChange={() => setPaymentType('Razorpay')} /> Pay online</label>
            </fieldset>
            <p className="payment-note">Need help? <a href="tel:7084515683">7084515683</a> · <a href="mailto:ssundram593@gmail.com">ssundram593@gmail.com</a></p>
            {errorMessage && <p className="checkout-error" role="alert">{errorMessage}</p>}
            <button type="submit" className="place-order" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : paymentType === 'COD' ? 'Place COD order' : 'Pay securely'}
            </button>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Cart;