import { useEffect, useState } from 'react'; // <--- Import Hooks
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/authservice';
import { getProducts } from '../../services/inventoryservice'; // <--- Import Service

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // State to store the real count
  const [productCount, setProductCount] = useState(0);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Fetch data when the page loads
  useEffect(() => {
    const fetchData = async () => {
      const products = await getProducts();
      setProductCount(products.length); // Update the state
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">POS System 🚀</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Welcome, {user.email}</span>
          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>
        <div>
          <div onClick={() => navigate('/pos')} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 cursor-pointer hover:bg-blue-50 transition">
            <h3 className="text-gray-500 text-sm">New Sale</h3>
            <p className="text-2xl font-bold text-gray-800">Open POS &rarr;</p>
          </div>
          
          <div onClick={() => navigate('/inventory')} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 cursor-pointer hover:bg-green-50 transition">
            <h3 className="text-gray-500 text-sm">Total Products</h3>
            <p className="text-2xl font-bold text-gray-800">{productCount}</p>
            <p className="text-xs text-blue-500 mt-2">Click to view details &rarr;</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-gray-500 text-sm">Active Orders</h3>
            <p className="text-2xl font-bold text-gray-800">0</p>
          </div>
        </div>
    </div>
  );
};


export default Dashboard;