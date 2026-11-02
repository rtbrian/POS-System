import { useEffect, useState } from 'react';
import { useCreateProduct, useDeleteProduct, useProducts } from '../../hooks/useProducts';
import { getErrorMessage } from '../../services/api';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Low Stock', 'Out of Stock'
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');

  // 🟢 STATE: Modal Form
  const [showModal, setShowModal] = useState(false);
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();
  const productsQuery = useProducts({
    page,
    limit: 50,
    search: debouncedSearch || undefined,
    stockStatus: filterStatus === 'Low Stock' ? 'low' : filterStatus === 'Out of Stock' ? 'out' : undefined,
  });
  const products = productsQuery.data?.data ?? [];

  // ✅ Updated State to include Category and Description
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    stock: '', 
    category: '', 
    description: '' 
  });

  // Debounce search so each keystroke does not trigger a request.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price === '' || formData.stock === '') return;

    setActionError('');
    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        category: formData.category || null,
        description: formData.description || null,
      });
      setPage(1);
      setShowModal(false);
      setFormData({ name: '', price: '', stock: '', category: '', description: '' });
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, 'Failed to add product'));
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
        await deleteMutation.mutateAsync(id);
      } catch (error: unknown) {
        setActionError(getErrorMessage(error, 'Failed to delete product'));
      }
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 lg:flex lg:h-dvh lg:overflow-hidden">
      <div className="flex min-w-0 flex-col lg:h-full lg:flex-1">
        
        {/* 🟢 HEADER */}
        <header className="z-10 flex flex-col gap-4 border-b border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="text-red-700" /> Inventory Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Track stock levels and manage catalog</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-800 active:scale-95 sm:w-auto"
          >
            <Plus size={20} />
            Add Product
          </button>
        </header>

        {/* 🟡 TOOLBAR: Search & Filter */}
        <div className="p-3 pb-0 sm:p-6 sm:pb-0">
          <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:p-4">
            <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
              <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-gray-50 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Filter size={18} className="text-gray-500" />
              <select 
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Status</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {(actionError || productsQuery.error) && (
          <div className="mx-3 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
            {actionError || getErrorMessage(productsQuery.error, 'Could not load products')}
          </div>
        )}

        {/* 🔵 TABLE AREA */}
        <div className="p-3 sm:flex-1 sm:overflow-y-auto sm:p-6">
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Product Name</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Price (KES)</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Stock Level</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
  {productsQuery.isLoading ? (
    <tr>
      <td colSpan={5} className="p-12 text-center text-gray-400">
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin h-8 w-8 text-red-600" />
          <p>Loading Inventory...</p>
        </div>
      </td>
    </tr>
  ) : products.length === 0 ? (
    <tr>
      <td colSpan={5} className="p-12 text-center text-gray-500">
        No products found matching your filters.
      </td>
    </tr>
  ) : (
    products.map((product) => {
      const status = getStockStatus(product.stock);
      return (
        <tr key={product.id} className="group transition-colors hover:bg-slate-50">
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
            <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              
              {/* EDIT BUTTON (Placeholder for now) */}
              <button 
                onClick={() => alert("Edit feature coming soon!")}
                className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-700 rounded-lg"
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
          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {productsQuery.data
                ? `${productsQuery.data.total} products · Page ${productsQuery.data.page} of ${Math.max(productsQuery.data.totalPages, 1)}`
                : 'Loading products'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || productsQuery.isFetching}
                className="rounded border px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!productsQuery.data || page >= productsQuery.data.totalPages || productsQuery.isFetching}
                className="rounded border px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* 🟣 MODAL POPUP (Updated with New Fields) */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4">
            <div className="my-auto max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
              
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Add New Product</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    placeholder="e.g., Milk 500ml"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                {/* Price & Stock & Category */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder="0"
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      <option value="">Select...</option>
                      <option value="Engine">Engine</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Brakes">Brakes</option>
                      <option value="Tyres & Wheels">Tyres &amp; Wheels</option>
                      <option value="Body & Controls">Body &amp; Controls</option>
                      <option value="Filters & Oils">Filters &amp; Oils</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none resize-none"
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
                    disabled={createMutation.isPending}
                    className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg font-bold shadow-md shadow-red-200 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending ? (
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