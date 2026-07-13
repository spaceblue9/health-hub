import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const { profile } = useOutletContext();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProfiles(data);
    } catch (error) {
      console.error('Error fetching profiles:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id, updates) => {
    if (!window.confirm('คุณต้องการยืนยันการบันทึกการตั้งค่านี้ใช่หรือไม่?')) return;
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id);
      if (error) throw error;
      fetchProfiles();
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-md md:p-xl max-w-6xl mx-auto space-y-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-sm mb-lg">
        <div>
          <h1 className="font-headline text-headline font-bold text-on-background flex items-center gap-sm">
            <span className="material-symbols-outlined text-[40px] text-primary">admin_panel_settings</span>
            Admin Dashboard
          </h1>
          <p className="font-body-lg text-body-lg text-text-muted mt-xs">จัดการบัญชีผู้ใช้งานระบบ Health Hub</p>
        </div>
      </div>

      <div className="bg-surface border border-border-light shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-body text-on-surface">
            <thead className="bg-surface-container-low text-on-surface-variant font-subhead uppercase text-xs border-b border-border-light">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Max Profiles</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {profiles.map(p => (
                <tr key={p.id} className="hover:bg-surface-bright transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-on-surface">{p.email || 'ไม่มีข้อมูลอีเมล'}</div>
                    <div className="font-code text-[10px] text-text-muted truncate max-w-[150px]" title={p.id}>{p.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${p.role === 'admin' ? 'bg-primary-container text-primary border border-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {p.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${p.status === 'approved' ? 'bg-green-100 text-success' : p.status === 'rejected' ? 'bg-red-100 text-error' : 'bg-yellow-100 text-warning'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      className="w-20 rounded-lg border-border-medium bg-background px-3 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      defaultValue={p.max_profiles}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val !== p.max_profiles) {
                          updateProfile(p.id, { max_profiles: val });
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-body text-on-surface cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={p.can_share || false}
                        onChange={(e) => updateProfile(p.id, { can_share: e.target.checked })}
                        className="rounded border-border-medium text-brand-fuchsia focus:ring-brand-fuchsia"
                      />
                      แชร์ลิงก์
                    </label>
                    <label className="flex items-center gap-2 text-xs font-body text-on-surface cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={p.can_report || false}
                        onChange={(e) => updateProfile(p.id, { can_report: e.target.checked })}
                        className="rounded border-border-medium text-brand-fuchsia focus:ring-brand-fuchsia"
                      />
                      ออกรายงาน
                    </label>
                    <label className="flex items-center gap-2 text-xs font-body text-on-surface cursor-pointer mt-1">
                      <input 
                        type="checkbox" 
                        checked={p.can_manage_caregivers || false}
                        onChange={(e) => updateProfile(p.id, { can_manage_caregivers: e.target.checked })}
                        className="rounded border-border-medium text-brand-fuchsia focus:ring-brand-fuchsia"
                      />
                      จัดการผู้ดูแล
                    </label>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {p.status !== 'approved' && (
                      <button onClick={() => updateProfile(p.id, { status: 'approved' })} className="text-success hover:bg-green-50 p-2 rounded-full transition-colors" title="Approve">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      </button>
                    )}
                    {p.status !== 'rejected' && (
                      <button onClick={() => updateProfile(p.id, { status: 'rejected' })} className="text-error hover:bg-red-50 p-2 rounded-full transition-colors" title="Reject">
                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {profiles.length === 0 && (
          <div className="p-12 text-center text-text-muted">ไม่พบข้อมูลผู้ใช้งาน</div>
        )}
      </div>
    </div>
  );
}
