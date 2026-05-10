import { useParams, Link } from "react-router-dom";
import NotFound from "../NotFound/NotFound";
import { formatPrice } from "../../utils/format";
import "./ProductDetail.css";

function ProductDetail({ products, addToCart, removeFromCart, getQuantityOfItemInCart }) {

  const { productId } = useParams();
  const product = products.find((p) => String(p.id) === productId);

  if (!product) {
    return <NotFound />;
  }

  const quantity = getQuantityOfItemInCart(product);

  const handleAddToCart = () => {
    if (product.id) {
      addToCart(product)
    }
  };

  const handleRemoveFromCart = () => {
    if (product.id) {
      removeFromCart(product);
    }
  };

  return (
    <div className="ProductDetail">
      <Link to="/" className="back-link">← Back to products</Link>
      <div className="product-card">
        <div className="media">
          <img src={product.imageUrl || "/placeholder.png"} alt={product.name} />
        </div>
        <div className="product-info">
          <p className="product-name">{product.name}</p>
          <p className="product-price">{formatPrice(product.price)}</p>
          <p className="description">{product.description}</p>
          <div className="actions">
            <button onClick={handleAddToCart}>Add to Cart</button>
            {quantity > 0 && <button onClick={handleRemoveFromCart}>Remove from Cart</button>}
            {quantity > 0 && <span className="quantity">Quantity: {quantity}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}


export default ProductDetail;