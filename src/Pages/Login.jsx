import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Login.css'

const Login = () => {
    const api_url = import.meta.env.VITE_API_URL
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [stage, setStage] = useState('phone')
    const [resendSeconds, setResendSeconds] = useState(0)
    const [toast, setToast] = useState('')
    const [profile, setProfile] = useState({
        name: '',
        addressLine: '',
        landmark: '',
        pincode: '',
        city: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const toastTimer = useRef(null)

    const navigate = useNavigate()
    const location = useLocation()

    const continueAfterLogin = () => {
        const returnState = location.state?.buyNowProduct
            ? { buyNowProduct: location.state.buyNowProduct }
            : undefined
        navigate(location.state?.returnTo || '/', { state: returnState })
    }

    useEffect(() => () => window.clearTimeout(toastTimer.current), [])

    useEffect(() => {
        if (resendSeconds === 0) return undefined

        const timer = window.setTimeout(() => {
            setResendSeconds((seconds) => Math.max(0, seconds - 1))
        }, 1000)

        return () => window.clearTimeout(timer)
    }, [resendSeconds])

    const showToast = (message) => {
        setToast(message)
        window.clearTimeout(toastTimer.current)
        toastTimer.current = window.setTimeout(() => setToast(''), 5000)
    }

    const sendOtp = async (e) => {
        e?.preventDefault()
        setErrorMessage('')
        setIsSubmitting(true)

        try {
            const res = await axios.post(`${api_url}/api/user/send-otp`, { phone })
            setStage('otp')
            setOtp('')
            setResendSeconds(30)
            showToast(res.data.debugOtp
                ? `Your development OTP is ${res.data.debugOtp}`
                : res.data.message || 'OTP sent to your mobile number')
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to send OTP. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const verifyOtp = async (otpValue = otp) => {
        if (isSubmitting) return
        setErrorMessage('')
        setIsSubmitting(true)

        try {
            const res = await axios.post(`${api_url}/api/user/verify-otp`, {
                phone,
                otp: otpValue
            })

            if (res.data.registrationRequired) {
                setStage('register')
                showToast('Mobile number verified. Complete your account details.')
                return
            }

            localStorage.setItem('token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.userData))
            continueAfterLogin()
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'OTP verification failed. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const completeRegistration = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        setIsSubmitting(true)

        try {
            const res = await axios.post(`${api_url}/api/user/register-phone`, {
                phone,
                name: profile.name,
                address: {
                    name: profile.name,
                    phone,
                    addressLine: profile.addressLine,
                    landmark: profile.landmark,
                    pincode: profile.pincode,
                    city: profile.city
                }
            })
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.userData))
            continueAfterLogin()
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to create your account. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const changePhone = () => {
        setStage('phone')
        setOtp('')
        setResendSeconds(0)
        setErrorMessage('')
    }

    const submit = (e) => {
        e.preventDefault()
        if (stage === 'phone') sendOtp()
        if (stage === 'otp') verifyOtp()
        if (stage === 'register') completeRegistration(e)
    }

    return (
        <div className="login-container">
            {toast && <div className="login-toast" role="status" aria-live="polite">{toast}</div>}
            <div className={`login-card ${stage === 'register' ? 'registration-card' : ''}`}>
                <h2>{stage === 'register' ? 'Complete your account' : stage === 'otp' ? 'Verify mobile number' : 'Login with mobile'}</h2>
                <p className="subtext">
                    {stage === 'phone' && 'Enter your mobile number to receive a one-time password.'}
                    {stage === 'otp' && `Enter the OTP sent to +91 ${phone}.`}
                    {stage === 'register' && 'Your number is verified. Add your delivery details to finish registration.'}
                </p>

                <form onSubmit={stage === 'register' ? completeRegistration : submit}>
                    {stage === 'phone' && (
                        <input
                            type="tel"
                            placeholder="10-digit mobile number"
                            autoComplete="tel-national"
                            inputMode="numeric"
                            pattern="[6-9][0-9]{9}"
                            minLength={10}
                            maxLength={10}
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        />
                    )}

                    {stage === 'otp' && (
                        <>
                            <input type="tel" value={`+91 ${phone}`} aria-label="Verified mobile number" readOnly />
                            <input
                                type="text"
                                placeholder="6-digit OTP"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                minLength={6}
                                maxLength={6}
                                autoComplete="one-time-code"
                                required
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                                    setOtp(value)
                                    if (value.length === 6) verifyOtp(value)
                                }}
                            />
                            <button type="button" className="forgot-btn" disabled={resendSeconds > 0 || isSubmitting} onClick={() => sendOtp()}>
                                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
                            </button>
                        </>
                    )}

                    {stage === 'register' && (
                        <>
                            <input type="tel" value={`+91 ${phone}`} aria-label="Verified mobile number" readOnly />
                            <input
                                type="text"
                                placeholder="Full name"
                                autoComplete="name"
                                maxLength={100}
                                required
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            />
                            <textarea
                                placeholder="House, street, area"
                                autoComplete="street-address"
                                minLength={5}
                                maxLength={250}
                                required
                                value={profile.addressLine}
                                onChange={(e) => setProfile({ ...profile, addressLine: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Landmark (optional)"
                                maxLength={120}
                                value={profile.landmark}
                                onChange={(e) => setProfile({ ...profile, landmark: e.target.value })}
                            />
                            <div className="login-registration-grid">
                                <input
                                    type="text"
                                    placeholder="6-digit PIN code"
                                    inputMode="numeric"
                                    pattern="[1-9][0-9]{5}"
                                    minLength={6}
                                    maxLength={6}
                                    autoComplete="postal-code"
                                    required
                                    value={profile.pincode}
                                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                />
                                <select required value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })}>
                                    <option value="">Choose city</option>
                                    <option value="Lucknow">Lucknow</option>
                                    <option value="Azamgarh">Azamgarh</option>
                                    <option value="Kanpur">Kanpur</option>
                                    <option value="Gorakhpur">Gorakhpur</option>
                                </select>
                            </div>
                        </>
                    )}

                    {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}

                    <button className="login-btn" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Please wait...' : stage === 'phone' ? 'Send OTP' : stage === 'otp' ? 'Verify OTP' : 'Continue'}
                    </button>

                    {stage !== 'phone' && (
                        <button type="button" className="forgot-btn" onClick={changePhone}>
                            Change mobile number
                        </button>
                    )}
                </form>
            </div>
        </div>
    )
}


export default Login