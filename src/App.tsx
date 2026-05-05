import { useState, useEffect, lazy, Suspense } from 'react';
import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
const NetworkTestPage = lazy(() => 
  import('./pages/NetworkTestPage').then(module => ({ default: module.NetworkTestPage }))
);

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

  useEffect(() => {
    if (primaryWallet) {
      const token = getAuthToken();
      if (token) {
        // Exchange the Dynamic RS256 JWT for a Copiale HS256 JWT.
        // The backend verifies the Dynamic token against Dynamic's JWKS
        // and returns a token signed with the server's JWT_SECRET.
        // If exchange fails (e.g. JWKS unreachable), fall back to the
        // raw Dynamic token — the requireJWT middleware handles both.
        exchangeDynamicToken(token)
          .then(copialeToken => {
            setAuthToken(copialeToken);
          })
          .catch(err => {
            console.warn('[App] Token exchange failed, using raw Dynamic token:', err.message);
            setAuthToken(token);
          });
      } else {
        console.error('No JWT token found after wallet connect!');
      }
      const getUserData = async () => {
        try {
          const response = await getAccount();
          setAccount(response.data);

          // Dispatch global auth state change event after successful login
          dispatchAuthStateChange(primaryWallet.address);
        } catch (err) {
          // Check if this is a 404 error for account not found
          const axiosError = err as { response?: { status?: number } };
          if (axiosError.response?.status === 404) {
            // Account doesn't exist yet - this is expected for new users
            // The API interceptor already logged a user-friendly warning
            setAccount(null);
          } else {
            // Log other errors normally
            console.error('Failed to fetch account:', err);
          }
        }
      };
      getUserData();
    } else {
      // User has disconnected their wallet
      setAccount(null);

      // Dispatch event for logout as well
      dispatchAuthStateChange(undefined);
    }
  }, [primaryWallet, primaryWallet?.address]);

  return (
    <Router>
      <div className="app">
        <Header isLoggedIn={!!primaryWallet} account={account} />
        <main className="main-content">
          <Container>
            <Suspense fallback={<PageLoader />}>
              <Routes>
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
                <Route path="/network-test" element={<NetworkTestPage />} />
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

export default App;
