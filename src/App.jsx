import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';
import { FontSizeProvider } from './contexts/FontSizeContext';

// Lazy-loaded pages (loaded on-demand for better initial performance)
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/Admin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Patient = lazy(() => import('./pages/Patient'));
const Share = lazy(() => import('./pages/Share'));
const SharingManagement = lazy(() => import('./pages/SharingManagement'));
const JoinCaregiver = lazy(() => import('./pages/JoinCaregiver'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="text-xl text-gray-500">Loading...</div></div>;
  }

  return (
    <ErrorBoundary>
      <FontSizeProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login session={session} />} />
              
              {/* Public Routes */}
              <Route path="/share/:token" element={<Share />} />
              <Route path="/join/:token" element={<JoinCaregiver session={session} />} />

              {/* Protected Routes wrapped in DashboardLayout */}
              <Route element={session ? <DashboardLayout session={session} /> : <Navigate to="/login" />}>
                <Route path="/" element={<Dashboard session={session} />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/patient/:id" element={<Patient session={session} />} />
                <Route path="/sharing" element={<SharingManagement session={session} />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </FontSizeProvider>
    </ErrorBoundary>
  );
}

export default App;
