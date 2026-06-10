import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { isAdminLoggedIn, setAdminToken } from '../../api/admin';

const navItems = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/trades', label: 'Trades' },
  { to: '/admin/accounts', label: 'Accounts' },
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/config', label: 'Config' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    setAdminToken(null);
    navigate('/admin/login');
  };

  if (!isAdminLoggedIn()) {
    navigate('/admin/login', { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-[60vh]">
      <aside className="w-56 shrink-0 bg-[#1c2128] border-r border-[#2d333b] p-4">
        <h2 className="text-lg font-bold text-[#e6edf3] mb-6">Admin</h2>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm ${
                  isActive
                    ? 'bg-[#2d333b] text-[#539bf5] font-medium'
                    : 'text-[#848e9c] hover:text-[#e6edf3] hover:bg-[#2d333b]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 px-3 py-2 text-sm text-[#f14c4c] hover:bg-[#2d333b] rounded w-full text-left"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
