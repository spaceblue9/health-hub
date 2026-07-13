import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatThaiDateFull } from '../utils/date';

export default function SharingManagement({ session }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select(`
          *,
          patients (
            name,
            profile_picture_url
          )
        `)
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching share links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('คุณต้องการยกเลิกการแชร์ลิงก์นี้ใช่หรือไม่? หลังจากนี้ผู้ที่มีลิงก์จะไม่สามารถเข้าดูได้อีก')) return;
    try {
      const { error } = await supabase
        .from('share_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLinks(links.filter(link => link.id !== id));
    } catch (error) {
      alert('Error revoking link: ' + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-md md:p-xl max-w-5xl mx-auto space-y-lg">
      <div>
        <h1 className="font-headline text-headline font-bold text-on-background">จัดการลิงก์แชร์ประวัติ</h1>
        <p className="font-body-lg text-text-muted mt-xs">ดูลิงก์ทั้งหมดที่คุณเคยสร้างไว้ หรือกดยกเลิกเพื่อปิดการเข้าถึง</p>
      </div>

      <div className="space-y-4">
        {links.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border-medium p-12 text-center bg-surface-container-low">
            <span className="material-symbols-outlined text-[48px] text-text-muted mb-4 opacity-50">link_off</span>
            <p className="text-text-muted font-body">ยังไม่มีการสร้างลิงก์แชร์ข้อมูล</p>
          </div>
        ) : (
          links.map((link) => {
            const isExpired = new Date(link.expires_at) < new Date();
            const shareUrl = `${window.location.origin}/share/${link.token}`;

            return (
              <div key={link.id} className="bg-surface rounded-2xl border border-border-light p-md shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-md hover:border-brand-fuchsia transition-colors">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container text-primary flex items-center justify-center font-display text-2xl font-bold shrink-0 overflow-hidden">
                    {link.patients?.profile_picture_url ? (
                      <img src={link.patients.profile_picture_url} alt={link.patients.name} className="w-full h-full object-cover" />
                    ) : (
                      link.patients?.name?.charAt(0) || '?'
                    )}
                  </div>
                  <div>
                    <h3 className="font-subhead text-subhead font-bold text-on-background">{link.patients?.name || 'ไม่ทราบชื่อ'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isExpired ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                        {isExpired ? 'หมดอายุแล้ว' : 'ใช้งานได้'}
                      </span>
                      <span className="text-xs text-text-muted">
                        หมดอายุ: {formatThaiDateFull(link.expires_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-sm w-full md:w-auto">
                  <div className="flex-1 w-full bg-background border border-border-medium rounded-xl px-3 py-2 flex items-center gap-2">
                    <input type="text" readOnly value={shareUrl} className="w-full bg-transparent outline-none font-code text-xs text-text-muted" />
                    <button 
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                      className="text-primary hover:text-brand-fuchsia flex shrink-0"
                      title="คัดลอกลิงก์"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => handleRevoke(link.id)}
                    className="w-full sm:w-auto shrink-0 px-4 py-2 bg-error/10 text-error font-bold text-sm rounded-xl hover:bg-error hover:text-white transition-colors whitespace-nowrap"
                  >
                    ยกเลิกการแชร์
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
