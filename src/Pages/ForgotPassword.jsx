import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ForgotPassword.css'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [password, setPassword] = useState('')
    const [step, setStep] = useState(1)
    const api_url = import.meta.env.VITE_API_URL
    const navigate = useNavigate()

    const sendOtp = async (e) => {
        e.preventDefault()

        try {
            const res = await axios.post(`${api_url}/api/user/forgot-password`, { email })
            if (res.status === 200) {
                alert('OTP sent to your email')
                setStep(2)
            }
        } catch (error) {
            console.log(error)
            alert('User not found or OTP could not be sent')
        }
    }

    const resetPassword = async (e) => {
        e.preventDefault()

        try {
            const res = await axios.post(`${api_url}/api/user/reset-password`, { email, otp, password })
            if (res.status === 200) {
                alert('Password changed successfully')
                navigate('/login')
            }
        } catch (error) {
            console.log(error)
            alert('Invalid OTP or reset failed')
        }
    }

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <div className="brand-box">
                    <div className="brand-icon">+</div>
                    <div>
                        <p>HealthHub</p>
                        <span>Reset Access</span>
                    </div>
                </div>

                <h2>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h2>
                <p className="step-text">Step {step} of 2</p>

                {step === 1 ? (
                    <form onSubmit={sendOtp}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className="forgot-btn-submit">Send OTP</button>
                    </form>
                ) : (
                    <form onSubmit={resetPassword}>
                        <input type="email" value={email} disabled />
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="forgot-btn-submit">Reset Password</button>
                    </form>
                )}
            </div>
        </div>
    )
}

export default ForgotPassword
