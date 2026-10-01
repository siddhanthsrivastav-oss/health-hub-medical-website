import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
    return (
        <footer className="health-footer">

            {/* Main Footer */}
            <div className="footer-container">

                {/* Brand */}
                <div className="footer-column footer-brand">
                    <div className="footer-logo">
                        <span className="footer-cross">+</span>
                        <span>HealthHub Medical</span>
                    </div>

                    <p>
                        Your trusted medical store for medicines,
                        wellness products, healthcare essentials
                        and dependable doorstep delivery.
                    </p>

                    <div className="footer-socials">
                        <a
                            href="https://wa.me/917081052602"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link"
                        >
                            WhatsApp
                        </a>

                        <a
                            href="https://t.me/"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link"
                        >
                            Telegram
                        </a>
                        <a
    href="https://www.facebook.com/healthhubmedical"
    target="_blank"
    rel="noreferrer"
    className="social-link"
>
    Facebook
</a>
                    </div>
                </div>


                {/* Quick Links */}
                <div className="footer-column">
                    <h3>Quick Links</h3>

                    <ul>
                        <li>
                            <Link to="/">Home</Link>
                        </li>

                        <li>
                            <Link to="/my-orders">My Orders</Link>
                        </li>

                        <li>
                            <Link to="/cart">View Cart</Link>
                        </li>

                        <li>
                            <Link to="/login">Login</Link>
                        </li>
                    </ul>
                </div>


                {/* Services */}
                <div className="footer-column">
                    <h3>Our Services</h3>

                    <ul>
                        <li>
                            <a href="tel:7081052602">
                                Medicine Delivery
                            </a>
                        </li>

                        <li>
                            <a href="tel:7081052602">
                                Consult a Doctor
                            </a>
                        </li>

                        <li>
                            <a href="tel:7081052602">
                                Book Lab Tests
                            </a>
                        </li>

                        <li>
                            <a href="tel:7081052602">
                                Healthcare Support
                            </a>
                        </li>
                    </ul>
                </div>


                {/* Contact */}
                <div className="footer-column footer-contact">
                    <h3>Contact Us</h3>

                    <div className="contact-item">
                        <span className="contact-icon">📍</span>
                        <p>
                            Your shop address here,
                            <br />
                            Uttar Pradesh, India
                        </p>
                    </div>

                    <div className="contact-item">
                        <span className="contact-icon">📞</span>
                        <a href="tel:7081052602">
                            7081052602
                        </a>
                    </div>

                    <div className="contact-item">
                        <span className="contact-icon">✉️</span>
                        <a href="mailto:sundramsrivastav165@gmail.com">
                            sundramsrivastav165@gmail.com
                        </a>
                    </div>
                </div>

            </div>


            {/* Bottom Footer */}
            <div className="footer-bottom">

                <p>
                    © {new Date().getFullYear()} HealthHub Medical.
                    All Rights Reserved.
                </p>

                <div className="footer-bottom-links">
                    <Link to="/">Privacy Policy</Link>
                    <Link to="/">Terms & Conditions</Link>
                </div>

            </div>

        </footer>
    )
}

export default Footer