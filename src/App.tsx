import { useState, useEffect, lazy, Suspense } from 'react';
import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { getAccount, setAuthToken, exchangeDynamicToken } from './api';
import { Account } from './api';
import Container from '@/components/Shared/Container';
import { Toaster } from 'sonner';
import { dispatchAuthStateChange } from './utils/events';
import { runStorageMigrations } from './utils/storageMigrations';

// Boot-time: drop legacy localStorage queues with shapes incompatible
// with the post-M3 wire contract. Idempotent (sentinel-gated).
runStorageMigrations();

// Lazy load route components for code splitting
const HomePage = lazy(() => import('./Home'));
const CreateOfferPage = lazy(() => import('@/offer/CreateOfferPage'));
const AccountPage = lazy(() => import('@/my/MyAccountPage'));
const MyOffersPage = lazy(() => import('./my/MyOffersPage'));
const MyTradesPage = lazy(() => import('./my/MyTradesPage'));
const MyEscrowsPage = lazy(() => import('./my/MyEscrowsPage'));
const OfferDetailPage = lazy(() => import('@/offer/OfferDetailPage'));
const MyTransactionsPage = lazy(() => import('./my/MyTransactionsPage'));
const EditOfferPage = lazy(() => import('@/offer/EditOfferPage'));
const TradePage = lazy(() => import('./TradePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const Status = lazy(() => import('./pages/Status'));
// NetworkTestPage is a named export, so we need to map it to default
const ManifestoPage = lazy(() => import('@/pages/ManifestoPage'));
const BiblePage = lazy(() => import('@/pages/BiblePage'));
const NetworkTestPage = lazy(() => 
  import('./pages/NetworkTestPage').then(module => ({ default: module.NetworkTestPage }))
);
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const FeesPage = lazy(() => import('@/pages/FeesPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminTradesPage = lazy(() => import('./pages/admin/AdminTradesPage'));
const AdminAccountsPage = lazy(() => import('./pages/admin/AdminAccountsPage'));
const AdminDisputesPage = lazy(() => import('./pages/admin/AdminDisputesPage'));
const AdminConfigPage = lazy(() => import('./pages/admin/AdminConfigPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <img src="/copiale-p2p.svg" alt="Copiale" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
      <p className="text-[#848e9c] text-sm">Loading...</p>
    </div>
  </div>
);

function App() {
  const { primaryWallet } = useDynamicContext();
  const [account, setAccount] = useState<Account | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (primaryWallet) {
      const token = getAuthToken();
      if (!token) {
        console.error('No JWT token found after wallet connect!');
        setAuthLoading(false);
        return;
      }

      // Exchange the Dynamic RS256 JWT for a Copiale HS256 JWT.
      // Must await before calling getAccount() so the axios instance
      // carries the correct auth header — otherwise getAccount() gets
      // a 401 and account stays null → AuthGate redirects to /register.
      const initAuth = async () => {
        try {
          const copialeToken = await exchangeDynamicToken(token);
          setAuthToken(copialeToken);
        } catch (err) {
          console.warn('[App] Token exchange failed, using raw Dynamic token:', (err as Error).message);
          setAuthToken(token);
        }

        try {
          const response = await getAccount();
          setAccount(response.data);
          dispatchAuthStateChange(primaryWallet.address);
        } catch (err) {
          const axiosError = err as { response?: { status?: number } };
          if (axiosError.response?.status === 404) {
            setAccount(null);
          } else {
            console.error('Failed to fetch account:', err);
          }
        } finally {
          setAuthLoading(false);
        }
      };
      initAuth();
    } else {
      setAccount(null);
      setAuthLoading(false);
      dispatchAuthStateChange(undefined);
    }
  }, [primaryWallet, primaryWallet?.address]);

  return (
    <Router>
      <div className="app">
        <AuthGate primaryWallet={primaryWallet} account={account} authLoading={authLoading} />
        <Header isLoggedIn={!!primaryWallet} account={account} />
        <main className="main-content">
          <Container>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage account={account} />} />
                <Route
                  path="/register"
                  element={<RegisterPage account={account} setAccount={setAccount} />}
                />
                <Route
                  path="/account"
                  element={<AccountPage account={account} setAccount={setAccount} />}
                />
                <Route path="/" element={<HomePage />} />
                <Route path="/create-offer" element={<CreateOfferPage account={account} />} />
                <Route path="/offers" element={<MyOffersPage account={account} />} />
                <Route path="/trades" element={<MyTradesPage account={account} />} />
                <Route path="/escrows" element={<MyEscrowsPage account={account} />} />
                <Route path="/transactions" element={<MyTransactionsPage account={account} />} />
                <Route path="/offer/:id" element={<OfferDetailPage />} />
                <Route path="/edit-offer/:id" element={<EditOfferPage />} />
                <Route path="/trade/:id" element={<TradePage />} />
                <Route path="/status" element={<Status />} />
                <Route path="/manifesto" element={<ManifestoPage />} />
                <Route path="/bible" element={<BiblePage />} />
                <Route path="/fees" element={<FeesPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/network-test" element={<NetworkTestPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="trades" element={<AdminTradesPage />} />
                  <Route path="accounts" element={<AdminAccountsPage />} />
                  <Route path="disputes" element={<AdminDisputesPage />} />
                  <Route path="config" element={<AdminConfigPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </Container>
        </main>
        <Footer />
        <Toaster position="bottom-right" closeButton={true} duration={10000} richColors />
      </div>
    </Router>
  );
}

function AuthGate({ primaryWallet, account, authLoading }: { primaryWallet: any; account: Account | null; authLoading: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || !primaryWallet) return;
    if (account !== null) return;

    const publicPaths = ['/login', '/register', '/account', '/manifesto', '/status', '/fees', '/terms', '/privacy', '/network-test', '/admin/login'];
    if (publicPaths.some(p => location.pathname.startsWith(p))) return;

    navigate('/register', { replace: true });
  }, [primaryWallet, account, authLoading, navigate, location.pathname]);

  return null;
}

export default App;
