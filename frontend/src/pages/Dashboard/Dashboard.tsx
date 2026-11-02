import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/authservice';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../auth/useAuth';
import { useProducts } from '../../hooks/useProducts';
import { useSalesAnalytics } from '../../hooks/useFinance';
import type { FinancePeriod } from '../../services/financeService';
import type { ReactNode } from 'react';
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react';

const SALES_PERIODS: { value: FinancePeriod; label: string; days: number }[] = [
  { value: 'today', label: 'Today', days: 1 },
  { value: '7days', label: 'Last 7 days', days: 7 },
  { value: '30days', label: 'Last 30 days', days: 30 },
  { value: '90days', label: 'Last 90 days', days: 90 },
];

const getPeriodDescription = (period: FinancePeriod): string => {
  const selectedPeriod = SALES_PERIODS.find((option) => option.value === period);
  if (!selectedPeriod) return '';

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - selectedPeriod.days + 1);

  const formatDate = (date: Date) => new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  return period === 'today'
    ? formatDate(end)
    : `${formatDate(start)} – ${formatDate(end)}`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const email = session?.user.email ?? 'User';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [salesPeriod, setSalesPeriod] = useState<FinancePeriod>('30days');
  const productsQuery = useProducts({ page: 1, limit: 1 });
  const salesQuery = useSalesAnalytics(salesPeriod);
  const productCount = productsQuery.data?.total;

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', getErrorMessage(error, 'Unknown error'));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 lg:h-dvh lg:flex-row">
      <aside
        className={`flex w-full shrink-0 flex-row items-center bg-slate-950 text-white shadow-xl transition-all duration-300 lg:h-full lg:flex-col ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-center border-r border-slate-800 px-3 lg:h-16 lg:w-full lg:border-b lg:border-r-0 lg:px-0">
          <div className="flex items-center gap-2 font-bold text-red-400 lg:gap-3 lg:text-xl">
            <Store size={24} />
            <span className="hidden lg:inline">Frima Auto</span>
          </div>
        </div>

        <nav className="flex min-w-0 flex-1 flex-row gap-1 overflow-x-auto px-2 py-2 lg:flex-col lg:gap-0 lg:space-y-2 lg:overflow-visible lg:px-3 lg:py-6" aria-label="Main navigation">
          <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" active isOpen={isSidebarOpen} onClick={() => {}} />
          <SidebarItem icon={<ShoppingCart size={20} />} text="POS / Sale" isOpen={isSidebarOpen} onClick={() => navigate('/pos')} />
          <SidebarItem icon={<Package size={20} />} text="Inventory" isOpen={isSidebarOpen} onClick={() => navigate('/inventory')} />
          <SidebarItem icon={<Users size={20} />} text="Customers & Accounts" isOpen={isSidebarOpen} onClick={() => navigate('/accounts')} />
        </nav>

        <div className="shrink-0 border-l border-slate-800 p-2 lg:w-full lg:border-l-0 lg:border-t lg:p-4">
          <button
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
            className="flex items-center justify-center gap-3 rounded-lg p-2 text-red-300 transition-colors hover:bg-slate-800 hover:text-white lg:w-full lg:justify-start"
          >
            <LogOut size={20} />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:h-16">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:block"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700">{email}</p>
              <p className="text-xs text-green-600">Online</p>
            </div>
            <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-red-700 font-bold">
              {email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:overflow-y-auto sm:p-5 md:p-8">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-700">Frima Auto</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 text-slate-500">A quick look at your store activity.</p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
            <button
              onClick={() => navigate('/pos')}
              className="group bg-red-800 p-5 text-left text-white transition-colors hover:bg-red-900"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-red-100">Quick action</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Open POS / Sale</h2>
                </div>
                <span className="rounded-lg bg-white/10 p-3 text-white transition-colors group-hover:bg-white/20">
                  <CreditCard size={22} />
                </span>
              </div>
              <p className="mt-4 text-sm text-red-100">Start a new transaction <span aria-hidden="true">→</span></p>
            </button>

            <button
              onClick={() => navigate('/inventory')}
              className="group bg-white p-5 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Inventory</p>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    {productsQuery.isLoading ? '…' : productCount ?? '—'}
                  </h2>
                </div>
                <span className="p-3 bg-slate-100 rounded-lg text-slate-700">
                  <Package size={22} />
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                {productsQuery.error
                  ? getErrorMessage(productsQuery.error, 'Could not load products')
                  : 'Products in your catalog'}
              </p>
            </button>

            <section className="bg-white p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Gross sales</p>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    {salesQuery.isLoading ? '…' : salesQuery.isError
                      ? '—'
                      : `KES ${Number(salesQuery.data?.grossSales ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </h2>
                </div>
                <span className="p-3 bg-amber-50 rounded-lg text-amber-700">
                  <BarChart3 size={22} />
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-4">{SALES_PERIODS.find((period) => period.value === salesPeriod)?.label}</p>
            </section>

            <section className="bg-white p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Transactions</p>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    {salesQuery.isLoading ? '…' : salesQuery.isError ? '—' : salesQuery.data?.transactionCount ?? 0}
                  </h2>
                </div>
                <span className="p-3 bg-slate-100 rounded-lg text-slate-700">
                  <ShoppingCart size={22} />
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                {salesQuery.isError
                  ? getErrorMessage(salesQuery.error, 'Could not load sales')
                  : 'In the selected period'}
              </p>
            </section>
          </div>

          <section className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 p-5 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={20} className="text-red-700" />
                  <h2 className="text-lg font-bold text-slate-900">Sales analytics</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">{getPeriodDescription(salesPeriod)}</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <CalendarDays size={17} aria-hidden="true" />
                <span className="sr-only">Sales period</span>
                <select
                  value={salesPeriod}
                  onChange={(event) => setSalesPeriod(event.target.value as FinancePeriod)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  {SALES_PERIODS.map((period) => (
                    <option key={period.value} value={period.value}>{period.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Sale</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Customer</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Items</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">Loading sales…</td>
                </tr>
                  ) : salesQuery.isError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-red-700">
                    {getErrorMessage(salesQuery.error, 'Could not load sales analytics')}
                  </td>
                </tr>
                  ) : !salesQuery.data || salesQuery.data.sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <BarChart3 size={22} />
                    </div>
                    <p className="mt-3 font-semibold text-slate-800">No sales in this period</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Completed sales from {getPeriodDescription(salesPeriod)} will appear here.
                    </p>
                  </td>
                </tr>
                  ) : salesQuery.data.sales.map((sale) => (
                <tr key={sale.id} className="border-t border-slate-100 text-slate-700">
                  <td className="px-5 py-3 font-semibold text-slate-900">#{sale.id}</td>
                  <td className="px-5 py-3">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(sale.createdAt))}</td>
                  <td className="px-5 py-3">{sale.customerName ?? 'Walk-in'}</td>
                  <td className="px-5 py-3">{sale.itemCount}</td>
                  <td className="px-5 py-3 text-right font-semibold">KES {Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                Gross sales include paid and credit sales. Credit balances are listed under Customers & Accounts.
              </p>
          </section>
        </main>
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: ReactNode;
  text: string;
  active?: boolean;
  isOpen: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon, text, active = false, isOpen, onClick }: SidebarItemProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    aria-label={text}
    title={text}
    className={`
      flex shrink-0 items-center justify-center gap-3 rounded-lg p-3 text-left transition-all lg:w-full lg:justify-start
      ${active ? 'bg-red-700 text-white shadow-lg shadow-red-950/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
      ${!isOpen && 'lg:justify-center'}
    `}
  >
    {icon}
    {isOpen && <span className="hidden font-medium lg:inline">{text}</span>}
  </button>
);

export default Dashboard;
