import { useEffect, useState } from 'react';
import { getProducts, type Product } from '../../services/inventoryservice';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  // Trash2, 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  LayoutGrid, 
  Package, 
  CreditCard 
} from 'lucide-react';

// Extend Product interface to include Quantity for the Cart
interface CartItem extends Product {
  qty: number;
}

// Mock Categories (You can fetch these from API later if you want)
const CATEGORIES = ['All', 'Dairy', 'Bakery', 'Drinks', 'Pantry', 'Snacks'];

const POS = () => {
  const navigate = useNavigate();
  
  // 🟢 STATE
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load Products on Mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Filter Logic (Search + Category)
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Note: If your API product doesn't have a 'category' field yet, this will just ignore category filtering
    const matchesCategory = selectedCategory === 'All' || (product as any).category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 3. Add to Cart (With Quantity Logic)
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        // If item exists, increase quantity
        return prevCart.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      // If new, add with qty 1
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  // 4. Update Quantity (Increase/Decrease)
  const updateQty = (id: number, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  // 5. Remove Item Completely
  const removeFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // 6. Calculate Totals
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
  const tax = subtotal * 0.16; // Example 16% VAT
  const total = subtotal + tax;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* 🟢 LEFT SIDE: Product Grid */}
      <div className="w-2/3 flex flex-col h-full">
        
        {/* Header Section */}
        <div className="bg-white p-4 shadow-sm z-10 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <LayoutGrid className="text-blue-600" /> Select Products
              </h1>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
              <input 
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Category Pills (Optional - visual only if data lacks categories) */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Loading Products...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all group flex flex-col items-center text-center h-48 justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                    Stock: {product.stock}
                  </div>
                  
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Package className="text-blue-500 h-8 w-8" />
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-gray-800 leading-tight mb-1">{product.name}</h3>
                    <p className="text-gray-500 text-sm">{product.description || 'No description'}</p>
                  </div>
                  
                  <div className="mt-2 font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    KES {Number(product.price).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🔵 RIGHT SIDE: Cart / Receipt */}
      <div className="w-1/3 bg-white shadow-2xl flex flex-col h-full border-l border-gray-200 z-20">
        
        {/* Cart Header */}
        <div className="p-5 bg-gray-900 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-400" />
              <h2 className="text-lg font-bold">Current Order</h2>
            </div>
            <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded text-white">
              {cart.reduce((acc, item) => acc + item.qty, 0)} Items
            </span>
          </div>
          <p className="text-gray-400 text-xs">Order ID: #{Date.now().toString().slice(-6)}</p>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p>Cart is empty</p>
              <p className="text-sm">Select items to start sale</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {/* Icon */}
                <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center border border-gray-200 text-blue-500">
                  <Package size={20} />
                </div>
                
                {/* Details */}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                  <p className="text-xs text-gray-500">KES {item.price}</p>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-green-600">
                    <Plus size={14} />
                  </button>
                </div>

                {/* Total & Remove */}
                <div className="text-right ml-2">
                  <p className="font-bold text-sm text-gray-800">{(Number(item.price) * item.qty).toLocaleString()}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 text-[10px] uppercase font-bold mt-1">
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Totals & Action */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (16%)</span>
              <span>KES {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
              <span className="font-bold text-gray-800 text-lg">Total Payable</span>
              <span className="font-bold text-2xl text-blue-600">KES {total.toLocaleString()}</span>
            </div>
          </div>
          
          <button 
            disabled={cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            <CreditCard size={20} />
            PAY KES {total.toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;