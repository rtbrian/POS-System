import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/authservice';
import { getProducts } from '../../services/inventoryservice';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  LogOut, 
  Menu, 
  Store,
  CreditCard
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  // Safe parsing of user data
  const user = JSON.parse(localStorage.getItem('user') || '{"email": "User"}');
  
  // State for UI and Data
  const [productCount, setProductCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 1. Fetch Data Logic (Kept exactly as you had it)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const products = await getProducts();
        setProductCount(products.length);
      } catch (error) {
        console.error("Failed to load products");
      }
    };
    fetchData();
  }, []);

  // 2. Logout Logic
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* 🟢 SIDEBAR (Navigation) */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col shadow-xl`}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <div className="flex items-center gap-3 font-bold text-xl text-blue-400">
            <Store size={24} />
            {isSidebarOpen && <span>B.M.Tech POS</span>}
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {/* We pass 'active' to highlight the current page */}
          <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" active isOpen={isSidebarOpen} onClick={() => {}} />
          <SidebarItem icon={<ShoppingCart size={20} />} text="POS / Sale" isOpen={isSidebarOpen} onClick={() => navigate('/pos')} />
          <SidebarItem icon={<Package size={20} />} text="Inventory" isOpen={isSidebarOpen} onClick={() => navigate('/inventory')} />
          <SidebarItem icon={<Users size={20} />} text="Customers" isOpen={isSidebarOpen} onClick={() => {}} />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-gray-800 p-2 rounded-lg transition-colors w-full ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* 🔵 MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-700">{user.email}</p>
              <p className="text-xs text-green-600">Online</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {user.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview</h2>

          {/* 👇 YOUR CARDS (Organized in a Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: New Sale (Clickable) */}
            <div 
              onClick={() => navigate('/pos')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-blue-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Quick Action</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1 group-hover:text-blue-600 transition-colors">Open POS/Sale</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CreditCard size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-4">Start a new transaction &rarr;</p>
            </div>

            {/* Card 2: Inventory Count (Connected to your Logic) */}
            <div 
              onClick={() => navigate('/inventory')}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-green-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Products</p>
                  {/* 👇 DISPLAYING YOUR STATE HERE */}
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{productCount}</h3>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Package size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-4">Items currently in stock</p>
            </div>

            {/* Card 3: Active Orders (Static for now) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Active Orders</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">0</h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                  <ShoppingCart size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-4">Orders in progress</p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

// Helper Component for Sidebar Items
// eslint-disable-next-line react/prop-types
const SidebarItem = ({ icon, text, active, isOpen, onClick }: any) => {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
        ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
        ${!isOpen && 'justify-center'}
      `}
    >
      {icon}
      {isOpen && <span className="font-medium">{text}</span>}
    </div>
  );
};

export default Dashboard;