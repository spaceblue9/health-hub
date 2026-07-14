import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const { profile } = useOutletContext();
  const [profiles, setProfiles] = useState([]);
  const [usageStats, setUsageStats] = useState([]);
  const [usageError, setUsageError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchProfiles();
    fetchUsageStats();
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

  const fetchUsageStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_usage_stats');
      if (error) throw error;
      setUsageStats(data || []);
      setUsageError(null);
    } catch (error) {
      console.error('Error fetching usage stats:', error.message);
      setUsageError(error.message);
    }
  };

  const handleSyncOldFiles = async () => {
    if (!window.confirm('ระบบจะตรวจสอบไฟล์ที่ขนาดเป็น 0 และทำการดึงข้อมูลขนาดไฟล์ใหม่ ซึ่งอาจใช้เวลาสักครู่ คุณต้องการดำเนินการต่อหรือไม่?')) return;
    
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0 });
    
    try {
      const { data: attachments, error: fetchError } = await supabase.rpc('admin_get_attachments_missing_size');
      if (fetchError) throw fetchError;
      
      if (!attachments || attachments.length === 0) {
        alert('ไม่พบไฟล์ที่ต้องซิงค์ขนาดข้อมูลครับ ทุกไฟล์มีข้อมูลขนาดครบถ้วนแล้ว');
        setIsSyncing(false);
        return;
      }

      setSyncProgress({ current: 0, total: attachments.length });

      let successCount = 0;
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        try {
          const response = await fetch(att.file_url, { method: 'HEAD' });
          if (response.ok) {
            const size = parseInt(response.headers.get('content-length') || '0', 10);
            if (size > 0) {
              await supabase.rpc('admin_update_attachment_size', { attachment_id: att.id, new_size: size });
              successCount++;
            }
          }
        } catch (err) {
          console.error(`Failed to get size for ${att.id}:`, err);
        }
        setSyncProgress({ current: i + 1, total: attachments.length });
      }

      alert(`ซิงค์ข้อมูลสำเร็จ จำนวน ${successCount} ไฟล์ จากทั้งหมด ${attachments.length} ไฟล์ที่ตรวจสอบ`);
      await fetchUsageStats();
    } catch (error) {
      console.error('Error syncing files:', error);
      alert('เกิดข้อผิดพลาดในการซิงค์: ' + error.message);
    } finally {
      setIsSyncing(false);
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

  const handleDeleteUser = async (userToDelete) => {
    if (!window.confirm(`คุณต้องการลบผู้ใช้ ${userToDelete.email} อย่างถาวรใช่หรือไม่?\n\nข้อมูลโปรไฟล์ผู้ป่วย การบันทึกไทม์ไลน์ และไฟล์แนบทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้`)) return;
    
    if (userToDelete.id === profile.id) {
       alert("ไม่สามารถลบบัญชีของตัวเองได้");
       return;
    }

    try {
      // 1. Fetch all storage files for this user via RPC (bypasses RLS)
      const { data: fileUrls, error: fetchError } = await supabase.rpc('get_user_storage_files', { target_user_id: userToDelete.id });
      
      if (fetchError) {
        console.error("Error fetching user files:", fetchError);
        // We'll continue anyway to at least delete the user from DB
      } else if (fileUrls && fileUrls.length > 0) {
        // 2. Extract paths and delete from storage
        const pathsToDelete = fileUrls
           .filter(Boolean)
           .map(url => {
             const parts = url.split('medical_attachments/');
             return parts.length > 1 ? parts[1] : null;
           })
           .filter(Boolean);
           
        if (pathsToDelete.length > 0) {
           const { error: storageError } = await supabase.storage.from('medical_attachments').remove(pathsToDelete);
           if (storageError) {
             console.error("Error deleting from storage:", storageError);
           }
        }
      }

      // 3. Delete user via database function (cascades database rows)
      const { error } = await supabase.rpc('delete_user', { user_id: userToDelete.id });
      if (error) throw error;
      
      fetchProfiles();
    } catch (error) {
      alert('Error deleting user: ' + error.message);
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

      <div className="flex gap-4 border-b border-border-light mb-lg">
        <button 
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-on-surface'}`}
        >
          จัดการผู้ใช้งาน
        </button>
        <button 
          onClick={() => setActiveTab('usage')}
          className={`py-2 px-4 font-bold border-b-2 transition-colors ${activeTab === 'usage' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-on-surface'}`}
        >
          ข้อมูลการใช้งานระบบ
        </button>
      </div>

      {activeTab === 'users' && (
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
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${p.role === 'admin' ? 'bg-primary-container text-on-primary-container border border-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
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
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    {p.status !== 'approved' && (
                      <button onClick={() => updateProfile(p.id, { status: 'approved' })} className="text-success hover:bg-green-50 p-2 rounded-full transition-colors" title="Approve">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      </button>
                    )}
                    {p.status !== 'rejected' && (
                      <button onClick={() => updateProfile(p.id, { status: 'rejected' })} className="text-warning hover:bg-yellow-50 p-2 rounded-full transition-colors" title="Reject">
                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                      </button>
                    )}
                    <button onClick={() => handleDeleteUser(p)} className="text-error hover:bg-red-50 p-2 rounded-full transition-colors" title="Delete User">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
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
      )}

      {activeTab === 'usage' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-end items-center gap-4">
            {isSyncing && (
              <span className="text-sm font-bold text-primary">
                กำลังซิงค์... {syncProgress.current} / {syncProgress.total}
              </span>
            )}
            <button
              onClick={handleSyncOldFiles}
              disabled={isSyncing}
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[20px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
              ซิงค์ขนาดไฟล์เก่า
            </button>
          </div>
          <div className="bg-surface border border-border-light shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-body text-on-surface">
              <thead className="bg-surface-container-low text-on-surface-variant font-subhead uppercase text-xs border-b border-border-light">
                <tr>
                  <th className="px-6 py-4">User Email</th>
                  <th className="px-6 py-4 text-right">จำนวนคนไข้</th>
                  <th className="px-6 py-4 text-right">จำนวนเหตุการณ์</th>
                  <th className="px-6 py-4 text-right">จำนวนไฟล์แนบ</th>
                  <th className="px-6 py-4 text-right">พื้นที่ Storage (MB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {usageStats.map(stat => (
                  <tr key={stat.user_id} className="hover:bg-surface-bright transition-colors">
                    <td className="px-6 py-4 font-bold">{stat.email || 'ไม่มีอีเมล'}</td>
                    <td className="px-6 py-4 text-right">{stat.total_patients || 0}</td>
                    <td className="px-6 py-4 text-right">{stat.total_events || 0}</td>
                    <td className="px-6 py-4 text-right">{stat.total_attachments || 0}</td>
                    <td className="px-6 py-4 text-right font-code text-primary">{((stat.total_storage_bytes || 0) / (1024 * 1024)).toFixed(2)} MB</td>
                  </tr>
                ))}
                {usageStats.length === 0 && !usageError && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-text-muted">ไม่พบข้อมูลการใช้งาน</td>
                  </tr>
                )}
                {usageError && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-error">
                      เกิดข้อผิดพลาดในการดึงข้อมูล: {usageError}
                      <br/>
                      <span className="text-xs text-text-muted">ตรวจสอบว่าได้รันคำสั่ง SQL ใน Supabase แล้วหรือยัง</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
