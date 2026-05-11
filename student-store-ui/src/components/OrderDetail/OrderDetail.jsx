import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { formatPrice, formatDate } from "../../utils/format"
import "./OrderDetail.css"

const API_BASE_URL = "http://localhost:3001"

function OrderDetail() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [productNames, setProductNames] = useState({})
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      setIsFetching(true)
      setError(null)
      try {
        const res = await axios.get(`${API_BASE_URL}/orders/${orderId}`)
        setOrder(res.data)
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Order not found.")
        } else {
          setError(
            err.response?.data?.error || err.message || "Failed to load order"
          )
        }
      } finally {
        setIsFetching(false)
      }
    }
    fetchOrder()
  }, [orderId])

  useEffect(() => {
    if (!order) return

    const fetchProductNames = async () => {
      const entries = await Promise.all(
        order.orderItems.map(async (item) => {
          const res = await axios.get(
            `${API_BASE_URL}/products/${item.productId}`
          )
          return [item.productId, res.data.name]
        })
      )
      setProductNames(Object.fromEntries(entries))
    }

    fetchProductNames()
  }, [order])

  return (
    <div className="OrderDetail">
      <Link to="/orders" className="back-link">
        ← Back to past orders
      </Link>

      {isFetching && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!isFetching && !error && order && (
        <>
          <h2>Order #{order.id}</h2>

          <div className="order-meta">
            <div>
              <strong>Date:</strong> {formatDate(order.createdAt)}
            </div>
            <div>
              <strong>Customer:</strong> {order.customerEmail}
            </div>
            <div>
              <strong>Status:</strong> {order.status}
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="center">Quantity</th>
                <th className="center">Unit Price</th>
                <th className="center">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map(
                (item) => (
                  console.log(item),
                  (
                    <tr key={item.id}>
                      <td>{productNames[item.productId] ?? "Loading..."}</td>{" "}
                      <td className="center">{item.quantity}</td>
                      <td className="center">{formatPrice(item.price)}</td>
                      <td className="center">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="total-label">
                  Total
                </td>
                <td className="center">
                  <strong>{formatPrice(order.totalPrice)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </>
      )}
    </div>
  )
}

export default OrderDetail
