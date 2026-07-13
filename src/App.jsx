import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Patient from './pages/Patient';
import Share from './pages/Share';
import SharingManagement from './pages/SharingManagement';
import JoinCaregiver from './pages/JoinCaregiver';
import DashboardLayout from './layouts/DashboardLayout';
import { FontSizeProvider } from './contexts/FontSizeContext';

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
    <FontSizeProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </FontSizeProvider>
  );
}

export default App;
