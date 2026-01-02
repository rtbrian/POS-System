import { useEffect, useState } from 'react';
import { getProducts, createProduct, type Product } from '../../services/inventoryservice';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';

const Inventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) return;

    try {
      // Send data to backend
      await createProduct(
        formData.name, 
        parseFloat(formData.price), 
        parseInt(formData.stock)
      );
      
      // Refresh list and close modal
      await loadProducts();
      setShowModal(false);
      setFormData({ name: '', price: '', stock: '' }); // Reset form
      alert("Product Added Successfully! ✅");
    } catch (error) {
      alert("Failed to add product");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-full shadow hover:bg-gray-50">
            <ArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-700 uppercase text-sm">
              <th className="py-3 px-6">ID</th>
              <th className="py-3 px-6">Product Name</th>
              <th className="py-3 px-6 text-right">Price (KES)</th>
              <th className="py-3 px-6 text-center">Stock</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {/* 👇 Check if loading is true */}
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-4 font-bold text-gray-500">
                  Loading Products...
                </td>
              </tr>
            ) : (
              /* 👇 If not loading, show the list */
              products.map((product) => (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6">{product.id}</td>
                  <td className="py-3 px-6 font-medium">{product.name}</td>
                  <td className="py-3 px-6 text-right">{product.price.toLocaleString()}</td>
                  <td className="py-3 px-6 text-center">{product.stock}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL POPUP */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-96">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add New Product</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Name</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Price (KES)</label>
                <input 
                  type="number" 
                  className="w-full border p-2 rounded" 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Stock Quantity</label>
                <input 
                  type="number" 
                  className="w-full border p-2 rounded" 
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;