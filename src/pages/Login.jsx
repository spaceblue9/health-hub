import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState('magic-link'); // 'magic-link' or 'password'
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let error;
      if (loginMode === 'password') {
        if (isSignUp) {
          const res = await supabase.auth.signUp({ email, password });
          error = res.error;
          if (!error) {
            // If email is already taken, Supabase returns fake user but identities array is empty
            if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
              setMessage({ type: 'error', text: 'อีเมลนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบ' });
              return;
            }
            setMessage({ type: 'success', text: 'สมัครสมาชิกสำเร็จ! โปรดเช็คอีเมลของคุณเพื่อยืนยันบัญชี' });
            return;
          }
        } else {
          const res = await supabase.auth.signInWithPassword({ email, password });
          error = res.error;
          if (!error) {
             setMessage({ type: 'success', text: 'เข้าสู่ระบบสำเร็จ!' });
             return; // the router will automatically redirect
          }
        }
      } else {
        const res = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        error = res.error;
        if (!error) setMessage({ type: 'success', text: 'เช็คอีเมลของคุณเพื่อรับลิงก์เข้าสู่ระบบ!' });
      }
      if (error) throw error;
    } catch (error) {
      // Human-readable error for rate limit
      if (error.message.includes('rate limit')) {
        setMessage({ type: 'error', text: 'คุณส่งอีเมลบ่อยเกินไป (Rate Limit) กรุณารอสักครู่ หรือใช้รหัสผ่านแทน' });
      } else {
        setMessage({ type: 'error', text: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-text-main font-body min-h-screen flex items-center justify-center">
      <main className="w-full max-w-6xl mx-auto p-md md:p-lg lg:p-xl flex flex-col lg:flex-row gap-lg lg:gap-xl h-full lg:h-[800px] items-center">
        
        {/* Left Side: Form Container */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center bg-surface rounded-[24px] p-lg md:p-xl shadow-lg border border-border-light relative overflow-hidden z-10">
          <div className="mb-xl flex items-center gap-sm">
            <span className="material-symbols-outlined text-[32px] text-brand-fuchsia" style={{ fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
            <h1 className="font-display text-subhead font-extrabold text-on-surface">Health Hub</h1>
          </div>
          
          <div className="mb-lg flex justify-between items-start">
            <div>
              <h2 className="font-headline text-headline text-on-background mb-xs">
                {loginMode === 'password' && isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
              </h2>
              <p className="font-body text-body text-text-muted">ยินดีต้อนรับเข้าสู่ Health Hub ระบบจัดการข้อมูลสุขภาพครอบครัว</p>
            </div>
            
            {/* Toggle Login Mode */}
            <div className="flex bg-surface-container-low p-1 rounded-lg border border-border-light text-xs font-bold">
              <button 
                type="button" 
                onClick={() => setLoginMode('magic-link')}
                className={`px-3 py-1.5 rounded-md transition-colors ${loginMode === 'magic-link' ? 'bg-surface shadow-sm text-brand-fuchsia' : 'text-text-muted hover:text-on-surface'}`}
              >
                Magic Link
              </button>
              <button 
                type="button" 
                onClick={() => setLoginMode('password')}
                className={`px-3 py-1.5 rounded-md transition-colors ${loginMode === 'password' ? 'bg-surface shadow-sm text-brand-fuchsia' : 'text-text-muted hover:text-on-surface'}`}
              >
                รหัสผ่าน
              </button>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-md">
            <div className="space-y-xs">
              <label className="font-caption text-caption text-on-surface block" htmlFor="email">อีเมล</label>
              <div className="relative flex items-center input-focus-ring rounded-[12px] border-[1.5px] border-border-medium bg-surface transition-all duration-200">
                <span className="material-symbols-outlined absolute left-sm text-text-muted">mail</span>
                <input 
                  className="w-full h-[44px] pl-[40px] pr-sm rounded-[12px] bg-transparent border-none focus:ring-0 font-body text-body text-on-surface placeholder:text-text-muted/50" 
                  id="email" 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                />
              </div>
            </div>
            
            {loginMode === 'password' && (
              <div className="space-y-xs animate-in fade-in slide-in-from-top-2">
                <label className="font-caption text-caption text-on-surface block" htmlFor="password">รหัสผ่าน</label>
                <div className="relative flex items-center input-focus-ring rounded-[12px] border-[1.5px] border-border-medium bg-surface transition-all duration-200">
                  <span className="material-symbols-outlined absolute left-sm text-text-muted">lock</span>
                  <input 
                    className="w-full h-[44px] pl-[40px] pr-sm rounded-[12px] bg-transparent border-none focus:ring-0 font-body text-body text-on-surface placeholder:text-text-muted/50" 
                    id="password" 
                    type="password"
                    required={loginMode === 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่านของคุณ" 
                  />
                </div>
              </div>
            )}
            
            <div className="pt-sm">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-brand-fuchsia text-on-primary font-body text-body font-bold rounded-full btn-hover transition-all duration-200 flex items-center justify-center gap-xs disabled:opacity-50"
              >
                {loading ? 'กำลังดำเนินการ...' : loginMode === 'password' ? (isSignUp ? 'สมัครสมาชิกด้วยรหัสผ่าน' : 'เข้าสู่ระบบด้วยรหัสผ่าน') : 'รับลิงก์เข้าสู่ระบบ (Magic Link)'}
                {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>
            </div>

            {loginMode === 'password' && (
              <div className="text-center mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-brand-fuchsia hover:underline font-bold"
                >
                  {isSignUp ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
                </button>
              </div>
            )}
          </form>

          {message.text && (
            <div className={`mt-6 rounded-lg p-4 text-sm font-body ${message.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-green-50 text-success'}`}>
              {message.text}
            </div>
          )}
          
          <div className="mt-lg p-sm bg-surface-container-low rounded-lg border border-border-light flex items-start gap-sm">
            <span class="material-symbols-outlined text-info text-[20px]">info</span>
            <p className="font-caption text-caption text-text-muted">
              หมายเหตุ: บัญชีผู้ใช้ใหม่จำเป็นต้องได้รับการอนุมัติจากผู้ดูแลระบบก่อนจึงจะสามารถสร้างโปรไฟล์ Health Hub ได้ เพื่อความปลอดภัยของข้อมูล
            </p>
          </div>
        </div>

        {/* Right Side: Image/Branding */}
        <div className="hidden lg:block w-1/2 h-full rounded-[24px] overflow-hidden relative shadow-md bg-surface-container-high">
          <div 
            className="absolute inset-0 bg-cover bg-center w-full h-full" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')" }}
          ></div>
          {/* Overlay to ensure brand fuchsia presence in imagery area */}
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-fuchsia/20 to-transparent mix-blend-multiply"></div>
          <div className="absolute bottom-0 left-0 right-0 p-xl bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <p className="font-subhead text-subhead text-white font-bold mb-xs">ติดตามสุขภาพของคนที่คุณรัก</p>
            <p className="font-body-lg text-body-lg text-white/90">รวบรวมข้อมูลสุขภาพ การเติบโต และประวัติการรักษา ไว้ในที่เดียวอย่างปลอดภัย</p>
          </div>
        </div>
      </main>
    </div>
  );
}
