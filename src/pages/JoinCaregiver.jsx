import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function JoinCaregiver({ session }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const { data: inviteData, error: inviteError } = await supabase
        .from('caregiver_invites')
        .select('*')
        .eq('token', token)
        .single();

      if (inviteError || !inviteData) {
        throw new Error('ลิงก์เชิญไม่ถูกต้อง หรือถูกยกเลิกไปแล้ว');
      }

      if (new Date(inviteData.expires_at) < new Date()) {
        throw new Error('ลิงก์เชิญหมดอายุแล้ว');
      }

      setInvite(inviteData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);

      if (invite.created_by === session.user.id) {
        throw new Error('คุณเป็นเจ้าของโปรไฟล์นี้อยู่แล้ว');
      }

      const { error: accessError } = await supabase
        .from('patient_access')
        .insert([{
          patient_id: invite.patient_id,
          user_id: session.user.id,
          role: 'editor'
        }]);

      if (accessError && accessError.code !== '23505') { 
        throw accessError;
      }

      await supabase.from('caregiver_invites').delete().eq('id', invite.id);

      alert('เข้าร่วมเป็นผู้ดูแลสำเร็จ!');
      navigate(`/patient/${invite.patient_id}`);

    } catch (err) {
      alert('Error joining: ' + err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body bg-background text-text-muted">กำลังตรวจสอบลิงก์...</div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-body p-md">
        <div className="w-full max-w-[400px] min-w-[280px] rounded-3xl bg-surface p-xl text-center shadow-lg border border-border-light relative overflow-hidden mx-auto">
          <div className="absolute top-0 left-0 right-0 h-2 bg-error"></div>
          <span className="material-symbols-outlined text-[64px] text-error mb-md opacity-80">link_off</span>
          <h2 className="text-subhead font-display font-bold text-on-background mb-sm">ไม่สามารถเข้าร่วมได้</h2>
          <p className="text-body text-text-muted mb-lg">{error}</p>
          <Link to="/" className="inline-block rounded-full bg-surface-container-high px-6 py-2 font-bold text-on-surface-variant hover:bg-surface-variant transition-colors">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-body p-md">
        <div className="w-full max-w-[400px] min-w-[280px] rounded-3xl bg-surface p-xl text-center shadow-lg border border-border-light relative overflow-hidden mx-auto">
          <div className="absolute top-0 left-0 right-0 h-2 bg-warning"></div>
          <span className="material-symbols-outlined text-[64px] text-warning mb-md">account_circle</span>
          <h2 className="text-subhead font-display font-bold text-on-background mb-sm">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-body text-text-muted mb-lg">คุณได้รับคำเชิญให้เป็นผู้ดูแลร่วม กรุณาเข้าสู่ระบบ หรือสมัครสมาชิกเพื่อยอมรับคำเชิญ</p>
          <div className="flex gap-sm justify-center">
             <Link to="/login" className="rounded-full bg-primary px-6 py-2 font-bold text-white hover:bg-[#7c008e] transition-colors">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-body p-md">
      <div className="w-full max-w-[400px] min-w-[280px] rounded-3xl bg-surface p-xl text-center shadow-lg border border-border-light relative overflow-hidden mx-auto">
        <div className="absolute top-0 left-0 right-0 h-2 bg-primary"></div>
        <span className="material-symbols-outlined text-[64px] text-primary mb-md">group_add</span>
        <h2 className="text-subhead font-display font-bold text-on-background mb-sm">คำเชิญเป็นผู้ดูแลร่วม</h2>
        <p className="text-body text-text-muted mb-lg">คุณได้รับคำเชิญให้เป็นผู้ดูแลผู้ป่วยร่วมกัน คุณจะสามารถดูและเพิ่มเหตุการณ์สุขภาพได้</p>
        <button onClick={handleAcceptInvite} className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white hover:bg-[#7c008e] transition-colors text-lg">
          ยอมรับคำเชิญ
        </button>
        <div className="mt-4">
          <Link to="/" className="text-text-muted hover:underline text-sm">ปฏิเสธและกลับหน้าหลัก</Link>
        </div>
      </div>
    </div>
  );
}
