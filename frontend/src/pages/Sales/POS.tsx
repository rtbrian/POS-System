import { useEffect, useState } from 'react';
import { getProducts, type Product } from '../../services/inventoryservice';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShoppingCart } from 'lucide-react';

interface CartItem extends Product {
  cartId: number; // Unique ID for the cart entry
}

const POS = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  // Load products when page opens
  useEffect(() => {
    loadProducts();
  }, []);

  // Update total whenever cart changes
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
    setTotal(newTotal);
  }, [cart]);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const addToCart = (product: Product) => {
    const newItem = { ...product, cartId: Date.now() }; // Add unique ID
    setCart([...cart, newItem]);
  };

  const removeFromCart = (cartId: number) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* LEFT SIDE: Product Grid */}
      <div className="w-2/3 p-6 overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-full shadow">
            <ArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Select Products</h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-xl shadow hover:shadow-lg hover:bg-blue-50 transition border border-transparent hover:border-blue-300 flex flex-col items-center justify-center h-32"
            >
              <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
              <p className="text-gray-500 font-medium">KES {product.price}</p>
              <div className="text-xs mt-2 bg-gray-200 px-2 py-1 rounded text-gray-600">
                Stock: {product.stock}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Cart / Receipt */}
      <div className="w-1/3 bg-white shadow-2xl flex flex-col h-full border-l">
        <div className="p-6 bg-blue-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={24} />
            <h2 className="text-xl font-bold">Current Order</h2>
          </div>
          <p className="text-blue-100 text-sm">{cart.length} items in cart</p>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <p>Cart is empty</p>
              <p className="text-sm">Click products to add them</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                <div>
                  <p className="font-bold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">KES {item.price}</p>
                </div>
                <button 
                  onClick={() => removeFromCart(item.cartId)}
                  className="text-red-400 hover:text-red-600 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Total & Pay Button */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-500 text-lg">Total Amount</span>
            <span className="text-3xl font-bold text-gray-800">KES {total.toLocaleString()}</span>
          </div>
          
          <button 
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg ${
              cart.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-[1.02] transition'
            }`}
          >
            COMPLETE SALE (KES {total})
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;