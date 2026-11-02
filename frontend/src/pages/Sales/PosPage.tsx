import { useEffect, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { type Product } from '../../services/inventoryservice';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../services/api';
import { useCreateSale } from '../../hooks/useFinance';
import type { PaymentMethod } from '../../services/financeService';
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

const CATEGORIES = ['All', 'Engine', 'Electrical', 'Brakes', 'Tyres & Wheels', 'Body & Controls', 'Filters & Oils', 'Other'];

const POS = () => {
  const navigate = useNavigate();
  
  // 🟢 STATE
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [paymentType, setPaymentType] = useState<'paid' | 'credit'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [saleError, setSaleError] = useState('');
  const [saleMessage, setSaleMessage] = useState('');
  const createSaleMutation = useCreateSale();
  const productsQuery = useProducts({
    page,
    limit: 50,
    search: debouncedSearch || undefined,
    category: selectedCategory === 'All' ? undefined : selectedCategory,
  });
  const products = productsQuery.data?.data ?? [];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // 3. Add to Cart (With Quantity Logic)
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prevCart;
        // If item exists, increase quantity
        return prevCart.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      if (product.stock < 1) return prevCart;
      // If new, add with qty 1
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  // 4. Update Quantity (Increase/Decrease)
  const updateQty = (id: number, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 && newQty <= item.stock ? { ...item, qty: newQty } : item;
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
  const total = subtotal;

  const handleCompleteSale = async () => {
    setSaleError('');
    setSaleMessage('');
    try {
      const sale = await createSaleMutation.mutateAsync({
        idempotencyKey,
        sale: {
          customerName: customerName.trim() || undefined,
          paymentType,
          paymentMethod: paymentType === 'paid' ? paymentMethod : undefined,
          items: cart.map(({ id, qty }) => ({ productId: id, quantity: qty })),
        },
      });
      setCart([]);
      setCustomerName('');
      setPaymentType('paid');
      setIdempotencyKey(crypto.randomUUID());
      setSaleMessage(
        paymentType === 'credit'
          ? `Sale #${sale.id} recorded as customer debt.`
          : `Sale #${sale.id} completed successfully.`,
      );
    } catch (error) {
      setSaleError(getErrorMessage(error, 'Could not complete the sale'));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-slate-100 lg:h-dvh lg:flex-row lg:overflow-hidden">
      
      {/* 🟢 LEFT SIDE: Product Grid */}
      <div className="flex h-[58dvh] min-h-[360px] flex-col lg:h-full lg:min-h-0 lg:w-2/3">
        
        {/* Header Section */}
        <div className="z-10 border-b border-slate-200 bg-white p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <LayoutGrid className="text-red-700" /> Select Products
              </h1>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
              <input 
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Category Pills (Optional - visual only if data lacks categories) */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === cat 
                    ? 'bg-red-700 text-white shadow-md shadow-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-6">
          {productsQuery.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {getErrorMessage(productsQuery.error, 'Could not load products')}
            </div>
          ) : productsQuery.isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Loading Products...</div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  aria-disabled={product.stock < 1}
                  className={`group relative flex h-48 flex-col items-center justify-between overflow-hidden rounded-lg border border-slate-200 border-b-2 border-b-transparent bg-white p-3 text-center transition-colors sm:p-4 ${
                    product.stock > 0 ? 'cursor-pointer hover:border-b-red-700 hover:bg-red-50/30' : 'cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-red-700 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                    Stock: {product.stock}
                  </div>
                  
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 transition-colors group-hover:bg-red-100 sm:h-14 sm:w-14">
                    <Package className="h-6 w-6 text-red-700 sm:h-7 sm:w-7" />
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-gray-800 leading-tight mb-1">{product.name}</h3>
                    <p className="text-gray-500 text-sm">{product.description || 'No description'}</p>
                  </div>
                  
                  <div className="mt-2 border-t border-slate-100 pt-2 font-bold text-red-800">
                    KES {Number(product.price).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          {productsQuery.data && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>{productsQuery.data.total} products · Page {page} of {Math.max(productsQuery.data.totalPages, 1)}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || productsQuery.isFetching}
                  className="rounded border bg-white px-3 py-1 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= productsQuery.data.totalPages || productsQuery.isFetching}
                  className="rounded border bg-white px-3 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔵 RIGHT SIDE: Cart / Receipt */}
      <div className="z-20 flex min-h-[70dvh] flex-col border-t border-slate-200 bg-white lg:h-full lg:min-h-0 lg:w-1/3 lg:border-l lg:border-t-0">
        
        {/* Cart Header */}
        <div className="border-b-4 border-red-700 bg-slate-950 p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-red-300" />
              <h2 className="text-lg font-bold">Current Order</h2>
            </div>
            <span className="bg-red-700 text-xs font-bold px-2 py-1 rounded text-white">
              {cart.reduce((acc, item) => acc + item.qty, 0)} Items
            </span>
          </div>
          <p className="text-gray-400 text-xs">Sale checkout</p>
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
              <div key={item.id} className="flex items-center gap-3 border-b border-slate-200 bg-white px-1 py-3 last:border-b-0">
                {/* Icon */}
                <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center border border-gray-200 text-red-600">
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
                  <button onClick={() => updateQty(item.id, 1)} disabled={item.qty >= item.stock} className="p-1 hover:bg-gray-100 rounded text-green-600 disabled:opacity-40">
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
        <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
          {saleMessage && (
            <p role="status" className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {saleMessage}
            </p>
          )}
          {saleError && (
            <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {saleError}
            </p>
          )}
          <div className="mb-4 space-y-3">
            <div>
              <label htmlFor="sale-customer" className="mb-1 block text-sm font-medium text-gray-700">
                Customer name {paymentType === 'credit' ? '(required for credit)' : '(optional)'}
              </label>
              <input
                id="sale-customer"
                type="text"
                maxLength={200}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                required={paymentType === 'credit'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="Walk-in customer"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sale-payment-type" className="mb-1 block text-sm font-medium text-gray-700">Sale type</label>
                <select
                  id="sale-payment-type"
                  value={paymentType}
                  onChange={(event) => setPaymentType(event.target.value as 'paid' | 'credit')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="paid">Paid</option>
                  <option value="credit">On credit</option>
                </select>
              </div>
              {paymentType === 'paid' && (
                <div>
                  <label htmlFor="sale-payment-method" className="mb-1 block text-sm font-medium text-gray-700">Payment</label>
                  <select
                    id="sale-payment-method"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile money</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
              <span className="font-bold text-gray-800 text-lg">Total Payable</span>
              <span className="font-bold text-2xl text-red-700">KES {total.toLocaleString()}</span>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => void handleCompleteSale()}
            disabled={cart.length === 0 || createSaleMutation.isPending || (paymentType === 'credit' && !customerName.trim())}
            className="w-full bg-red-700 hover:bg-red-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            <CreditCard size={20} />
            {createSaleMutation.isPending
              ? 'Saving sale…'
              : paymentType === 'credit'
                ? `RECORD DEBT · KES ${total.toLocaleString()}`
                : `COMPLETE SALE · KES ${total.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;