import { useEffect, useState } from 'react';
import { getProducts, createProduct, deleteProduct type Product } from '../../services/inventoryservice';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Loader2 
} from 'lucide-react';

const Inventory = () => {
  const navigate = useNavigate();
  
  // 🟢 STATE: Data & UI
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Low Stock', 'Out of Stock'

  // 🟢 STATE: Modal Form
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ Updated State to include Category and Description
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    stock: '', 
    category: '', 
    description: '' 
  });

  // 1. Fetch Data
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Filter Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'Low Stock') matchesStatus = product.stock > 0 && product.stock <= 10;
    if (filterStatus === 'Out of Stock') matchesStatus = product.stock === 0;

    return matchesSearch && matchesStatus;
  });

  // 3. Submit Logic (Includes new fields)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) return;

    setIsSubmitting(true);
    try {
      await createProduct(
        formData.name, 
        parseFloat(formData.price), 
        parseInt(formData.stock),
        formData.category,   // Passing Category
        formData.description // Passing Description
      );
      
      await loadProducts(); // Refresh list
      setShowModal(false);
      setFormData({ name: '', price: '', stock: '', category: '', description: '' }); // Reset
      alert("Product Created Successfully! 🎉");
    } catch (error) {
      alert("Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Helper for Stock Colors
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: <AlertTriangle size={14} /> };
    if (stock <= 10) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700', icon: <AlertTriangle size={14} /> };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> };
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(product => product.id !== id));
      } catch (error) {
        alert("Failed to delete product");
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col h-full">
        
        {/* 🟢 HEADER */}
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="text-blue-600" /> Inventory Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Track stock levels and manage catalog</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus size={20} />
            Add Product
          </button>
        </header>

        {/* 🟡 TOOLBAR: Search & Filter */}
        <div className="p-6 pb-0">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <Filter size={18} className="text-gray-500" />
              <select 
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* 🔵 TABLE AREA */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Product Name</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Price (KES)</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Stock Level</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-100">
  {loading ? (
    <tr>
      <td colSpan={5} className="p-12 text-center text-gray-400">
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          <p>Loading Inventory...</p>
        </div>
      </td>
    </tr>
  ) : filteredProducts.length === 0 ? (
    <tr>
      <td colSpan={5} className="p-12 text-center text-gray-500">
        No products found matching your search.
      </td>
    </tr>
  ) : (
    filteredProducts.map((product) => {
      const status = getStockStatus(product.stock);
      return (
        <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
          <td className="p-4">
            <p className="font-bold text-gray-800">{product.name}</p>
            <p className="text-xs text-gray-400">ID: #{product.id}</p>
          </td>
          <td className="p-4 font-medium text-gray-800 text-right">
            KES {Number(product.price).toLocaleString()}
          </td>
          <td className="p-4">
            <div className="w-32">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold">{product.stock} units</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${status.label === 'Low Stock' ? 'bg-orange-500' : status.label === 'Out of Stock' ? 'bg-red-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(product.stock, 100)}%` }} 
                />
              </div>
            </div>
          </td>
          <td className="p-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </td>
          <td className="p-4 text-right">
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              
              {/* EDIT BUTTON (Placeholder for now) */}
              <button 
                onClick={() => alert("Edit feature coming soon!")}
                className="p-2 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg"
              >
                <Edit size={16} />
              </button>

              {/* DELETE BUTTON (Now Active) */}
              <button 
                onClick={() => handleDelete(product.id)}
                className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        </tr>
      );
    })
  )}
</tbody>
            </table>
          </div>
        </div>

        {/* 🟣 MODAL POPUP (Updated with New Fields) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Add New Product</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g., Milk 500ml"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                {/* Price & Stock & Category */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0"
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      <option value="">Select...</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Pantry">Pantry</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Enter product details..."
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold shadow-md shadow-blue-200 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" /> Saving...
                      </>
                    ) : (
                      'Save Product'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Inventory;