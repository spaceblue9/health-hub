import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { formatThaiDateShort } from '../utils/date';
import ThaiDatePicker from '../components/ThaiDatePicker';

export default function Dashboard({ session }) {
  const [patients, setPatients] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [notes, setNotes] = useState('');
  const [hn, setHn] = useState('');
  const [oxygenLevel, setOxygenLevel] = useState('');
  const [temperature, setTemperature] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(profileData);

      const { data: ownedPatients } = await supabase.from('patients').select('*').eq('user_id', session.user.id);
      
      const { data: accessData } = await supabase.from('patient_access').select('patients(*)').eq('user_id', session.user.id);
      const sharedPatients = accessData?.filter(a => a.patients).map(a => a.patients) || [];
      
      const allPatients = [...(ownedPatients || []), ...sharedPatients];
      const uniquePatients = Array.from(new Map(allPatients.map(p => [p.id, p])).values());
      uniquePatients.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setPatients(uniquePatients);

      if (uniquePatients.length > 0) {
        const patientIds = uniquePatients.map(p => p.id);
        const { data: eventsData } = await supabase
          .from('timeline_events')
          .select('*, patients!inner(name)')
          .in('patient_id', patientIds)
          .order('event_date', { ascending: false })
          .limit(5);
        setRecentEvents(eventsData || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (patients.length >= (profile?.max_profiles || 3)) {
      alert(`คุณจำกัดการสร้างโปรไฟล์ไว้ที่ ${profile?.max_profiles} โปรไฟล์`);
      return;
    }
    
    setUploading(true);
    try {
      let profile_picture_url = null;
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/profiles/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('medical_attachments')
          .upload(filePath, profilePicture);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('medical_attachments')
          .getPublicUrl(filePath);
          
        profile_picture_url = publicUrlData.publicUrl;
      }
    
      const { data, error: insertError } = await supabase.from('patients').insert([{ 
        user_id: session.user.id, 
        name, 
        dob: dob || null,
        notes,
        hn,
        oxygen_level: oxygenLevel,
        temperature: temperature ? parseFloat(temperature) : null,
        profile_picture_url
      }]).select();
      
      if (insertError) throw insertError;
      
      setPatients([data[0], ...patients]);
      setShowForm(false);
      setName('');
      setDob('');
      setNotes('');
      setHn('');
      setOxygenLevel('');
      setTemperature('');
      setProfilePicture(null);
    } catch (error) {
      alert('Error creating profile: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return '-';
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) return <div className="p-8 text-center text-text-muted">กำลังโหลดข้อมูล...</div>;

  if (profile?.status === 'pending') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md rounded-2xl bg-surface p-8 text-center shadow-lg border border-border-light">
          <span className="material-symbols-outlined text-[48px] text-warning mb-4">pending_actions</span>
          <h2 className="text-2xl font-bold text-on-background">รอการอนุมัติ</h2>
          <p className="mt-4 text-text-muted">บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ โปรดกลับมาตรวจสอบอีกครั้งในภายหลัง</p>
        </div>
      </div>
    );
  }

  // Pre-defined bg colors for avatar aesthetics
  const avatarColors = [
    'bg-primary-container text-primary border-primary-container',
    'bg-secondary-container text-secondary border-secondary-container',
    'bg-tertiary-container text-tertiary border-tertiary-container',
  ];

  return (
    <div className="p-md md:p-xl space-y-xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-sm mb-lg">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl md:text-headline font-bold text-on-background">ภาพรวมครอบครัว</h1>
          <p className="font-body-lg text-base sm:text-body-lg text-text-muted mt-xs">ติดตามสุขภาพและกิจกรรมของทุกคนในบ้าน</p>
          <p className="font-caption text-caption text-brand-fuchsia mt-1">ใช้โควต้า: {patients.length} / {profile?.max_profiles || 3}</p>
        </div>
        {patients.length < (profile?.max_profiles || 3) && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-on-primary font-bold rounded-full px-lg py-sm flex items-center justify-center gap-xs hover:bg-[#C026D3] transition-colors shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            เพิ่มบุคคล
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreatePatient} className="mb-8 rounded-2xl border border-border-light bg-surface p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-subhead font-bold text-on-background">สร้างโปรไฟล์ใหม่</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">รูปโปรไฟล์ (ไม่บังคับ)</label>
              <input type="file" accept="image/*" onChange={e => setProfilePicture(e.target.files[0])} className="w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-primary hover:file:bg-primary hover:file:text-white transition-colors" />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">ชื่อ-นามสกุล / ชื่อเล่น</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">วันเกิด</label>
              <ThaiDatePicker 
                value={dob} 
                onChange={setDob} 
                className="w-full"
              />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">รหัสประจำตัว (HN)</label>
              <input type="text" value={hn} onChange={e => setHn(e.target.value)} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" placeholder="เช่น HN46170607" />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">ค่าออกซิเจน (SpO2)</label>
              <input type="text" value={oxygenLevel} onChange={e => setOxygenLevel(e.target.value)} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" placeholder="เช่น 98%" />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">อุณหภูมิ (°C)</label>
              <input type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" placeholder="เช่น 36.5" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-caption text-caption text-on-surface block mb-1">หมายเหตุ (ประวัติสำคัญ ฯลฯ)</label>
              <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia"></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-border-medium bg-surface px-6 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors">ยกเลิก</button>
            <button type="submit" disabled={uploading} className="rounded-full bg-brand-fuchsia px-6 py-2 text-sm font-bold text-on-primary shadow-sm hover:bg-primary transition-colors disabled:opacity-50">
              {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      )}

      {/* Profile Cards Grid (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {patients.map((patient, index) => {
          const colorClass = avatarColors[index % avatarColors.length];
          const bgClass = colorClass.split(' ')[0]; // Extract bg class
          
          return (
            <div 
              key={patient.id} 
              onClick={() => navigate(`/patient/${patient.id}`)}
              className="bg-surface rounded-[16px] border border-border-light p-md product-hover flex flex-col relative overflow-hidden group cursor-pointer"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${bgClass} rounded-bl-full opacity-20 -z-10 group-hover:scale-110 transition-transform`}></div>
              
              <div className="flex items-center justify-between mb-sm">
                <div className="flex items-center gap-sm">
                  <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center font-display text-4xl font-bold shrink-0 ${colorClass}`}>
                    {patient.profile_picture_url ? (
                      <img src={patient.profile_picture_url} alt={patient.name} className="w-full h-full object-cover" />
                    ) : (
                      patient.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h2 className="font-headline text-xl sm:text-title-lg font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{patient.name}</h2>
                  </div>
                </div>
                <button className="text-text-muted hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              
              <div className="mt-auto space-y-xs">
                <div className="flex justify-between items-center py-xs border-b border-border-light border-dashed">
                  <span className="font-body-sm text-body-sm text-text-muted">อายุ</span>
                  <span className="font-body-sm text-body-sm font-medium">{calculateAge(patient.dob)} ปี</span>
                </div>
                <div className="flex justify-between items-center py-xs border-b border-border-light border-dashed">
                  <span className="font-body-sm text-body-sm text-text-muted">น้ำหนักล่าสุด</span>
                  <span className="font-body-sm text-body-sm font-medium">{patient.weight ? `${patient.weight} กก.` : '-'}</span>
                </div>
                <div className="flex justify-between items-center py-xs">
                  <span className="font-body-sm text-body-sm text-text-muted">วันเกิด</span>
                  <span className="font-body-sm text-body-sm font-medium text-primary">{patient.dob ? formatThaiDateShort(patient.dob) : '-'}</span>
                </div>
              </div>
            </div>
          );
        })}
        
        {patients.length === 0 && !showForm && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-border-medium p-12 text-center bg-surface-container-low">
            <span className="material-symbols-outlined text-[48px] text-text-muted mb-4 opacity-50">family_restroom</span>
            <p className="text-text-muted font-body">ยังไม่มีโปรไฟล์คนในครอบครัว คลิก "เพิ่มบุคคล" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>

      {/* Recent Activities Section */}
      {recentEvents.length > 0 && (
        <section className="mt-xl">
          <h2 className="font-subhead text-subhead font-bold text-on-background mb-md">กิจกรรมล่าสุด</h2>
          <div className="bg-surface rounded-[16px] border border-border-light p-md shadow-sm">
            <div className="relative pl-sm">
              {/* Timeline Line */}
              <div className="absolute top-2 bottom-2 left-[21px] w-0.5 bg-border-light"></div>
              
              {/* Timeline Items */}
              <div className="space-y-md">
                {recentEvents.map((event, index) => {
                   const colorClass = avatarColors[index % avatarColors.length];
                   return (
                    <div key={event.id} className="relative flex gap-md items-start group cursor-pointer" onClick={() => navigate(`/patient/${event.patient_id}`)}>
                      <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center shrink-0 z-10 border-4 border-surface shadow-sm group-hover:scale-110 transition-transform`}>
                        <span className="material-symbols-outlined text-[20px]">medical_services</span>
                      </div>
                      <div className="flex-1 pt-1 border-b border-border-light pb-md last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <p className="font-body text-body font-medium text-on-background">
                            <span className="font-bold text-primary mr-1">{event.patients?.name}:</span> 
                            {event.title}
                          </p>
                          <span className="font-caption text-caption text-text-muted whitespace-nowrap ml-4">
                            {formatThaiDateShort(event.event_date)}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-text-muted mt-xs line-clamp-1">{event.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
