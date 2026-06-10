import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@/components/Shared/Container';
import { adminLogin, setAdminToken } from '../../api/admin';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      setAdminToken(res.data.token);
      navigate('/admin');
    } catch (err: unknown) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md p-8 bg-[#1c2128] rounded-lg border border-[#2d333b]">
        <h1 className="text-2xl font-bold text-[#e6edf3] mb-6">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#848e9c] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-[#2d333b] border border-[#444c56] rounded text-[#e6edf3] focus:outline-none focus:border-[#539bf5]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#848e9c] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#2d333b] border border-[#444c56] rounded text-[#e6edf3] focus:outline-none focus:border-[#539bf5]"
              required
            />
          </div>
          {error && <p className="text-[#f14c4c] text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#539bf5] text-white rounded hover:bg-[#4184e4] disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
