import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./MyOrder.css";

const MyOrders = () => {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const api_url = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const getMyOrders = async () => {
    try {

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${api_url}/api/order/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("MY ORDERS:", response.data);

      setOrders(response.data.orders || []);

    } catch (error) {

      console.log(
        "GET MY ORDERS ERROR:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
        "Could not load your orders"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMyOrders();
  }, []);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="orders-loading">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="my-orders-container">

      {/* =========================
          HEADER
      ========================= */}

      <div className="my-orders-header">

        <h1>My Orders</h1>

        <p>
          View your orders and track your medicine delivery.
        </p>

      </div>


      {/* =========================
          ERROR
      ========================= */}

      {errorMessage && (
        <div className="orders-error">
          {errorMessage}
        </div>
      )}


      {/* =========================
          NO ORDERS
      ========================= */}

      {orders.length === 0 ? (

        <div className="empty-orders">

          <h2>No orders found</h2>

          <p>
            You haven't placed any orders yet.
          </p>

          <button
            className="continue-shopping-btn"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>

        </div>

      ) : (

        /* =========================
           ORDERS LIST
        ========================= */

        <div className="orders-list">

          {orders.map((order) => (

            <div
              className="order-card"
              key={order._id}
            >

              {/* =========================
                  ORDER TOP
              ========================= */}

              <div className="order-card-top">

                <div>

                  <h3 className="order-id">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </h3>

                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }
                    )}
                  </p>

                </div>

                <span className="order-status">
                  {order.orderStatus}
                </span>

              </div>


              {/* =========================
                  ORDER ITEMS
              ========================= */}

              <div className="order-items">

                {order.items?.map((item, index) => (

                  <div
                    className="order-item"
                    key={item.productId?._id || index}
                  >

                    <img
                      src={
                        item.productId?.images?.[0]?.url ||
                        item.imageUrl ||
                        "https://via.placeholder.com/80"
                      }
                      alt={item.productName}
                      className="order-item-image"
                    />

                    <div className="order-item-details">

                      <h3>
                        {item.productName}
                      </h3>

                      <p>
                        Qty: {item.qty}
                      </p>

                      <p>
                        Price: ₹{Number(item.price).toLocaleString("en-IN")}
                      </p>

                    </div>

                  </div>

                ))}

              </div>


              {/* =========================
                  ORDER BOTTOM
              ========================= */}

              <div className="order-card-bottom">

                <p className="order-total">
                  Total
                  <strong>
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </strong>
                </p>

                <button
                  className="track-order-btn"
                  onClick={() =>
                    navigate(`/track-order/${order._id}`)
                  }
                >
                  Track Order
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
};

export default MyOrders;