import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useFontSize } from '../contexts/FontSizeContext';

export default function DashboardLayout({ session }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const location = useLocation();
  const { fontLevel, setFontLevel } = useFontSize();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error.message);
        setProfileError(error.message);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [session]);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Admin', path: '/admin', icon: 'admin_panel_settings', adminOnly: true },
    { name: 'Sharing', path: '/sharing', icon: 'ios_share' }
  ];

  if (loadingProfile) {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="text-xl text-gray-500">Loading Profile...</div></div>;
  }

  if (profileError) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <span className="material-symbols-outlined text-[64px] text-error mb-4">error</span>
        <h2 className="text-2xl font-bold mb-2">Profile Fetch Error</h2>
        <p className="text-error mb-2">{profileError}</p>
        <p className="text-text-muted mb-6">User ID: {session?.user?.id}</p>
        <button onClick={handleLogout} className="px-6 py-2 bg-surface text-on-surface border border-border-medium rounded-full font-bold hover:bg-surface-bright transition-colors">
          ออกจากระบบ
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <span className="material-symbols-outlined text-[64px] text-warning mb-4">warning</span>
        <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
        <p className="text-text-muted mb-6">ไม่พบข้อมูล Profile ของคุณในฐานข้อมูล (User ID: {session?.user?.id})</p>
        <button onClick={handleLogout} className="px-6 py-2 bg-surface text-on-surface border border-border-medium rounded-full font-bold hover:bg-surface-bright transition-colors">
          ออกจากระบบ
        </button>
      </div>
    );
  }

  if (profile?.status === 'pending') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <span className="material-symbols-outlined text-[64px] text-warning mb-4">hourglass_empty</span>
        <h2 className="text-2xl font-bold mb-2">รอการอนุมัติ</h2>
        <p className="text-text-muted mb-6">บัญชีของคุณกำลังรอการตรวจสอบจากผู้ดูแลระบบ</p>
        <button onClick={handleLogout} className="px-6 py-2 bg-surface text-on-surface border border-border-medium rounded-full font-bold hover:bg-surface-bright transition-colors">
          ออกจากระบบ
        </button>
      </div>
    );
  }

  if (profile?.status === 'rejected') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <span className="material-symbols-outlined text-[64px] text-error mb-4">cancel</span>
        <h2 className="text-2xl font-bold mb-2">บัญชีถูกปฏิเสธ</h2>
        <p className="text-text-muted mb-6">ขออภัย บัญชีของคุณไม่ได้รับการอนุมัติให้เข้าใช้งานระบบ</p>
        <button onClick={handleLogout} className="px-6 py-2 bg-surface text-on-surface border border-border-medium rounded-full font-bold hover:bg-surface-bright transition-colors">
          ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body text-body antialiased flex h-screen print:h-auto overflow-hidden print:overflow-visible print:block">
      
      {/* SideNavBar (Desktop) */}
      <nav className={`bg-surface border-r border-border-light shadow-md flex-col h-full w-64 flex-shrink-0 relative z-40 ${mobileMenuOpen ? 'flex absolute inset-y-0 left-0' : 'hidden md:flex'}`}>
        {/* Header */}
        <div className="p-md flex items-center justify-between border-b border-border-light">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center overflow-hidden shrink-0">
              <span className="material-symbols-outlined text-[24px]">family_restroom</span>
            </div>
            <div>
              <div className="font-display text-subhead font-extrabold text-primary leading-none text-xl">Health Hub</div>
              <div className="font-caption text-caption text-on-surface-variant">Family Records</div>
            </div>
          </div>
          {/* Mobile close button */}
          <button className="md:hidden text-text-muted hover:text-on-surface" onClick={() => setMobileMenuOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-md gap-sm flex flex-col">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            
            // Hide Admin link if not admin
            if (link.adminOnly && profile?.role !== 'admin') {
              return null;
            }

            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-sm px-sm py-xs rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-container text-on-primary-container font-bold opacity-100' 
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Footer Tabs */}
        <div className="p-md gap-sm flex flex-col border-t border-border-light">
          <div className="flex flex-col gap-2 mb-2 bg-surface-container-low p-2 rounded-2xl border border-border-light shadow-sm">
            <span className="text-xs font-bold text-text-muted text-center flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px]">format_size</span> ขนาดตัวอักษร
            </span>
            <div className="flex items-center justify-between gap-1 bg-surface-container-high rounded-full p-1">
              <button onClick={() => setFontLevel(1)} className={`flex-1 flex items-center justify-center py-1.5 rounded-full transition-all ${fontLevel === 1 ? 'bg-surface shadow-sm text-primary font-bold scale-105' : 'text-text-muted hover:text-on-surface'}`} title="ขนาดเล็กมาก">
                <span className="text-[9px]">A</span>
              </button>
              <button onClick={() => setFontLevel(2)} className={`flex-1 flex items-center justify-center py-1.5 rounded-full transition-all ${fontLevel === 2 ? 'bg-surface shadow-sm text-primary font-bold scale-105' : 'text-text-muted hover:text-on-surface'}`} title="ขนาดเล็ก">
                <span className="text-[11px]">A</span>
              </button>
              <button onClick={() => setFontLevel(3)} className={`flex-1 flex items-center justify-center py-1.5 rounded-full transition-all ${fontLevel === 3 ? 'bg-surface shadow-sm text-primary font-bold scale-105' : 'text-text-muted hover:text-on-surface'}`} title="ขนาดปกติ">
                <span className="text-sm">A</span>
              </button>
              <button onClick={() => setFontLevel(4)} className={`flex-1 flex items-center justify-center py-1.5 rounded-full transition-all ${fontLevel === 4 ? 'bg-surface shadow-sm text-primary font-bold scale-105' : 'text-text-muted hover:text-on-surface'}`} title="ขนาดใหญ่">
                <span className="text-base">A</span>
              </button>
              <button onClick={() => setFontLevel(5)} className={`flex-1 flex items-center justify-center py-1.5 rounded-full transition-all ${fontLevel === 5 ? 'bg-surface shadow-sm text-primary font-bold scale-105' : 'text-text-muted hover:text-on-surface'}`} title="ขนาดใหญ่พิเศษ">
                <span className="text-lg">A</span>
              </button>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center justify-center gap-sm py-sm bg-surface-container-high text-on-surface-variant font-bold rounded-full shadow-sm hover:bg-surface-variant transition-colors duration-200 mb-sm">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
          <div className="text-center text-[10px] text-text-muted/60 mt-1 pb-1">
            Developed by penthammachat
          </div>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TopNavBar */}
        <header className="bg-surface border-b border-border-light shadow-sm flex justify-between items-center px-lg py-sm w-full sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-sm">
            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="font-display text-subhead font-extrabold text-primary text-xl md:hidden">Health Hub</div>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-sm text-on-surface-variant">
              <span className="font-body-sm hidden sm:inline-block mr-2">{session?.user?.email}</span>
              <button className="hover:text-primary transition-colors duration-200 relative">
                <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content (Canvas Area) */}
        <main className="flex-1 overflow-y-auto print:overflow-visible bg-background print:block">
          <Outlet context={{ profile }} />
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}
