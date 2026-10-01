import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./TrackOrder.css";

const TrackOrder = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const api_url = import.meta.env.VITE_API_URL;

    const statuses = [
        {
            key: "Placed",
            title: "Order Placed",
            message: "Your order has been placed successfully."
        },
        {
            key: "Confirmed",
            title: "Order Confirmed",
            message: "Your order has been confirmed."
        },
        {
            key: "Packed",
            title: "Order Packed",
            message: "Your order has been packed."
        },
        {
            key: "Shipped",
            title: "Order Shipped",
            message: "Your order has been shipped."
        },
        {
            key: "OutForDelivery",
            title: "Out for Delivery",
            message: "Your order is out for delivery."
        },
        {
            key: "Delivered",
            title: "Delivered",
            message: "Your order has been delivered."
        }
    ];

    const getOrder = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(
                `${api_url}/api/order/my-orders/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("TRACK ORDER:", response.data);

            setOrder(response.data.order);
        } catch (error) {
            console.log(
                "GET TRACK ORDER ERROR:",
                error.response?.data || error.message
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not load order"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getOrder();
    }, [id]);

    const getCurrentIndex = () => {
        if (!order) return -1;

        return statuses.findIndex(
            (item) => item.key === order.orderStatus
        );
    };

    if (loading) {
        return (
            <div className="track-loading">
                Loading order...
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="track-error-page">
                <h2>{errorMessage}</h2>

                <button onClick={() => navigate("/my-orders")}>
                    Back to My Orders
                </button>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const currentIndex = getCurrentIndex();

    return (
        <div className="track-order-container">

            <div className="track-order-header">

                <button
                    className="back-orders-btn"
                    onClick={() => navigate("/my-orders")}
                >
                    ← Back to My Orders
                </button>

                <h1>Track Your Order</h1>

                <p>
                    Order #
                    {order._id.slice(-8).toUpperCase()}
                </p>

            </div>

            {/* ORDER SUMMARY */}

            <div className="track-order-card">

                <div className="track-summary">

                    <div>
                        <span>Order Date</span>
                        <strong>
                            {new Date(
                                order.createdAt
                            ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                            })}
                        </strong>
                    </div>

                    <div>
                        <span>Payment</span>
                        <strong>
                            {order.paymentType}
                        </strong>
                    </div>

                    <div>
                        <span>Total Amount</span>
                        <strong>
                            ₹
                            {Number(
                                order.totalAmount
                            ).toLocaleString("en-IN")}
                        </strong>
                    </div>

                    <div>
                        <span>Status</span>
                        <strong className="current-status">
                            {order.orderStatus}
                        </strong>
                    </div>

                </div>

                {/* CANCELLED */}

                {order.orderStatus === "Cancelled" ? (
                    <div className="cancelled-box">
                        <div className="cancelled-icon">
                            ✕
                        </div>

                        <div>
                            <h3>Order Cancelled</h3>
                            <p>
                                This order has been cancelled.
                            </p>
                        </div>
                    </div>
                ) : (

                    <div className="tracking-timeline">

                        {statuses.map((status, index) => {

                            const completed =
                                index <= currentIndex;

                            const isCurrent =
                                index === currentIndex;

                            return (
                                <div
                                    className={`timeline-item ${
                                        completed
                                            ? "completed"
                                            : ""
                                    } ${
                                        isCurrent
                                            ? "current"
                                            : ""
                                    }`}
                                    key={status.key}
                                >

                                    <div className="timeline-left">

                                        <div className="timeline-dot">
                                            {completed
                                                ? "✓"
                                                : ""}
                                        </div>

                                        {index !==
                                            statuses.length - 1 && (
                                            <div className="timeline-line" />
                                        )}

                                    </div>

                                    <div className="timeline-content">

                                        <h3>
                                            {status.title}
                                        </h3>

                                        <p>
                                            {status.message}
                                        </p>

                                        {isCurrent && (
                                            <span className="current-badge">
                                                Current Status
                                            </span>
                                        )}

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

            {/* ORDER ITEMS */}

            <div className="track-order-card">

                <h2>Order Items</h2>

                <div className="track-items">

                    {order.items?.map((item, index) => (

                        <div
                            className="track-item"
                            key={
                                item.productId?._id ||
                                index
                            }
                        >

                            <img
                                src={
                                    item.productId?.images?.[0]?.url ||
                                    item.imageUrl ||
                                    "https://via.placeholder.com/80"
                                }
                                alt={item.productName}
                            />

                            <div className="track-item-info">

                                <h3>
                                    {item.productName}
                                </h3>

                                <p>
                                    Quantity: {item.qty}
                                </p>

                                <p>
                                    Price: ₹
                                    {Number(
                                        item.price
                                    ).toLocaleString("en-IN")}
                                </p>

                            </div>

                        </div>

                    ))}

                </div>

                <div className="track-total">

                    <span>Total</span>

                    <strong>
                        ₹
                        {Number(
                            order.totalAmount
                        ).toLocaleString("en-IN")}
                    </strong>

                </div>

            </div>

            {/* DELIVERY ADDRESS */}

            <div className="track-order-card">

                <h2>Delivery Address</h2>

                <div className="address-box">

                    <h3>{order.address?.name}</h3>

                    <p>
                        {order.address?.addressLine}
                    </p>

                    {order.address?.landmark && (
                        <p>
                            Landmark:{" "}
                            {order.address.landmark}
                        </p>
                    )}

                    <p>
                        {order.address?.city} -{" "}
                        {order.address?.pincode}
                    </p>

                    <p>
                        Phone: {order.address?.phone}
                    </p>

                </div>

            </div>

        </div>
    );
};

export default TrackOrder;