import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { formatPrice, formatDate } from "../../utils/format";
import "./PastOrders.css";

const API_BASE_URL = "http://localhost:3001";

function PastOrders() {
  const [orders, setOrders] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const url = activeFilter
          ? `${API_BASE_URL}/orders?customer_email=${encodeURIComponent(activeFilter)}`
          : `${API_BASE_URL}/orders`;
        const res = await axios.get(url);
        setOrders(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load orders");
      } finally {
        setIsFetching(false);
      }
    };
    fetchOrders();
  }, [activeFilter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setActiveFilter(emailInput.trim());
  };

  const handleClear = () => {
    setEmailInput("");
    setActiveFilter("");
  };

  return (
    <div className="PastOrders">
      <Link to="/" className="back-link">← Back to products</Link>
      <h2>Past Orders</h2>

      <form className="filter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Filter by customer email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
        />
        <button type="submit">Filter</button>
        {activeFilter && (
          <button type="button" className="clear-button" onClick={handleClear}>
            Show all
          </button>
        )}
      </form>

      {isFetching && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!isFetching && !error && orders.length === 0 && (
        <p className="empty">
          {activeFilter ? `No orders found for ${activeFilter}.` : "No orders yet."}
        </p>
      )}

      {!isFetching && orders.length > 0 && (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="order-row">
                <td>
                  <Link to={`/orders/${order.id}`}>#{order.id}</Link>
                </td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{order.customerEmail}</td>
                <td>{formatPrice(order.totalPrice)}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PastOrders;
