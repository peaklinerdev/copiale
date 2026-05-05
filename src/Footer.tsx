import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Container from '@/components/Shared/Container';
import { getHealth, HealthResponse } from '@/api';
import { BarChart3 } from 'lucide-react';

export const Footer: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await getHealth();
        setHealth(response.data);
      } catch (err) {
        console.error('Health check failed:', err);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-[#111318] border-t border-white/[0.04] shadow-[0_-1px_4px_rgba(0,0,0,0.3)] py-12 mt-auto">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/copiale-p2p.svg" alt="Copiale" className="w-6 h-6 opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-bold text-[#eaecef]">Copiale-p2p</span>
            </Link>
            <p className="text-xs text-[#848e9c] leading-relaxed">
              Decentralized P2P escrow trading.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-[#eaecef] tracking-wider">Service</h3>
            <nav className="flex flex-col gap-2 text-xs">
              <Link to="/" className="text-[#848e9c] hover:text-[#FF6B00]">P2P Trading</Link>
              <Link to="/status" className="text-[#848e9c] hover:text-[#FF6B00]">System Status</Link>
              <a href="#" className="text-[#848e9c] hover:text-[#FF6B00]">Fees & Limits</a>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-[#eaecef] tracking-wider">Support</h3>
            <nav className="flex flex-col gap-2 text-xs">
              <a href="mailto:support@copiale-p2p.com" className="text-[#848e9c] hover:text-[#FF6B00]">Help Center</a>
              <a href="#" className="text-[#848e9c] hover:text-[#FF6B00]">API Documentation</a>
              <a href="#" className="text-[#848e9c] hover:text-[#FF6B00]">Contact Us</a>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-[#eaecef] tracking-wider">Legal</h3>
            <nav className="flex flex-col gap-2 text-xs">
              <a href="#" className="text-[#848e9c] hover:text-[#FF6B00]">Terms of Use</a>
              <a href="#" className="text-[#848e9c] hover:text-[#FF6B00]">Privacy Policy</a>
              <Link to="/manifesto" className="text-[#848e9c] hover:text-[#FF6B00]">Manifesto</Link>
            </nav>
          </div>
        </div>

        <div className="pt-8 border-t border-[#2b3139] flex flex-col md:row justify-between items-center gap-4">
          <p className="text-[10px] text-[#5e6673]">
            &copy; {new Date().getFullYear()} Copiale-p2p. All rights reserved.
          </p>
          
          {health && (
            <div className="flex gap-4 text-[9px] text-[#474d57] font-medium uppercase tracking-tighter">
              <span>API: {health.apiVersion?.version ?? '—'}</span>
              <span>•</span>
              <span>DB: {health.dbStatus ?? '—'}</span>
              <span>•</span>
              <span>Contract: {health.contractVersion ?? '—'}</span>
            </div>
          )}
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
