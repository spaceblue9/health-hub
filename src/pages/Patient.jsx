import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatThaiDateFull } from '../utils/date';
import ThaiDatePicker from '../components/ThaiDatePicker';
import QRCode from 'react-qr-code';

const MEDICAL_ICONS = [
  'medical_information', 'prescriptions', 'vaccines', 'monitor_heart', 
  'stethoscope', 'allergies', 'healing', 'local_pharmacy', 
  'accessible', 'bloodtype', 'dentistry', 'psychology', 
  'skeleton', 'vital_signs', 'front_hand', 'visibility',
  'hearing', 'coronavirus', 'pill'
];

export default function Patient({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [patientAttachments, setPatientAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showShareForm, setShowShareForm] = useState(false);
  const [showCaregivers, setShowCaregivers] = useState(false);
  const [caregivers, setCaregivers] = useState([]);
  const [caregiverInvites, setCaregiverInvites] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [shareDays, setShareDays] = useState(7);
  const [shareLink, setShareLink] = useState('');

  // Edit Form State
  const [editData, setEditData] = useState({
    name: '', dob: '', weight: '', height: '', blood_pressure: '', allergies: '', underlying_conditions: '', notes: ''
  });
  const [editProfilePicture, setEditProfilePicture] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Filter State (used for Timeline, Report, and Share)
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [cardColor, setCardColor] = useState('#fef7ff');
  const [textColor, setTextColor] = useState('#832890');
  const [icon, setIcon] = useState('medical_information');
  const [isHiddenFromShare, setIsHiddenFromShare] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Inline Edit Event State
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventData, setEditEventData] = useState({ title: '', description: '', event_date: '', card_color: '#fef7ff', text_color: '#832890', icon: 'medical_information', is_hidden_from_share: false });
  const [editFile, setEditFile] = useState(null);
  
  // Patient Profile Attachments
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [uploadingPatientFile, setUploadingPatientFile] = useState(false);
  const [patientFile, setPatientFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(profileData);
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (patientError || !patientData) {
        navigate('/');
        return;
      }
      setPatient(patientData);
      setEditData({
        name: patientData.name || '',
        dob: patientData.dob || '',
        weight: patientData.weight || '',
        height: patientData.height || '',
        blood_pressure: patientData.blood_pressure || '',
        allergies: patientData.allergies || '',
        underlying_conditions: patientData.underlying_conditions || '',
        notes: patientData.notes || ''
      });

      const { data: eventsData } = await supabase
        .from('timeline_events')
        .select(`*, attachments(*)`)
        .eq('patient_id', id)
        .order('event_date', { ascending: false });
        
      setEvents(eventsData || []);

      const { data: pAttachmentsData } = await supabase
        .from('attachments')
        .select('*')
        .eq('patient_id', id)
        .is('event_id', null)
        .order('created_at', { ascending: false });
      setPatientAttachments(pAttachmentsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPatientAttachment = async (e) => {
    e.preventDefault();
    if (!patientFile) return;
    setUploadingPatientFile(true);
    try {
      const fileExt = patientFile.name.split('.').pop();
      const filePath = `${session.user.id}/patient_${id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('medical_attachments')
        .upload(filePath, patientFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('medical_attachments')
        .getPublicUrl(filePath);

      const { error: attachError } = await supabase.from('attachments').insert([{
        patient_id: id,
        file_name: patientFile.name,
        file_url: publicUrlData.publicUrl,
        file_type: patientFile.type
      }]);
      if (attachError) throw attachError;
      
      setPatientFile(null);
      await fetchData();
    } catch (error) {
      alert('Error uploading document: ' + error.message);
    } finally {
      setUploadingPatientFile(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      // 1. Create Event
      const { data: eventData, error: eventError } = await supabase
        .from('timeline_events')
        .insert([{ patient_id: id, title, description, event_date: eventDate, card_color: cardColor, text_color: textColor, icon, is_hidden_from_share: isHiddenFromShare }])
        .select()
        .single();

      if (eventError) throw eventError;

      // 2. Upload File (if any)
      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}/${eventData.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('medical_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 3. Save Attachment Record
        const { data: publicUrlData } = supabase.storage
          .from('medical_attachments')
          .getPublicUrl(filePath);

        const { error: attachError } = await supabase.from('attachments').insert([{
          event_id: eventData.id,
          file_name: file.name,
          file_url: publicUrlData.publicUrl,
          file_type: file.type
        }]);
        if (attachError) throw attachError;
      }

      await fetchData();
      setShowEventForm(false);
      setTitle('');
      setDescription('');
      setEventDate(new Date().toISOString().split('T')[0]);
      setCardColor('#fef7ff');
      setTextColor('#832890');
      setIcon('medical_information');
      setIsHiddenFromShare(false);
      setFile(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('คุณต้องการลบเหตุการณ์นี้ใช่หรือไม่? ข้อมูลและไฟล์แนบที่เกี่ยวข้องจะถูกลบทั้งหมด')) return;
    try {
      // 1. Delete attachments from storage first
      const { data: eventAttachments } = await supabase.from('attachments').select('*').eq('event_id', eventId);
      if (eventAttachments && eventAttachments.length > 0) {
        const paths = eventAttachments.map(a => {
          const parts = a.file_url.split('medical_attachments/');
          return parts.length > 1 ? parts[1] : null;
        }).filter(Boolean);
        if (paths.length > 0) {
          await supabase.storage.from('medical_attachments').remove(paths);
        }
      }

      // 2. Delete event from DB
      const { error } = await supabase.from('timeline_events').delete().eq('id', eventId);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      alert('Error deleting event: ' + error.message);
    }
  };

  const handleDeleteAttachment = async (attachmentId, fileUrl) => {
    if (!window.confirm('คุณต้องการลบไฟล์แนบนี้ใช่หรือไม่?')) return;
    try {
      const pathPart = fileUrl.split('medical_attachments/')[1];
      if (pathPart) {
        await supabase.storage.from('medical_attachments').remove([pathPart]);
      }
      await supabase.from('attachments').delete().eq('id', attachmentId);
      await fetchData();
    } catch (error) {
      alert('Error deleting attachment: ' + error.message);
    }
  };

  const handleStartEditEvent = (event) => {
    setEditingEventId(event.id);
    setEditEventData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date.split('T')[0], // Format for input type="date"
      card_color: event.card_color || '#fef7ff',
      text_color: event.text_color || '#832890',
      icon: event.icon || 'medical_information',
      is_hidden_from_share: event.is_hidden_from_share || false
    });
    setEditFile(null);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('timeline_events')
        .update({
          title: editEventData.title,
          description: editEventData.description,
          event_date: editEventData.event_date,
          card_color: editEventData.card_color,
          text_color: editEventData.text_color,
          icon: editEventData.icon,
          is_hidden_from_share: editEventData.is_hidden_from_share
        })
        .eq('id', editingEventId);

      if (error) throw error;

      // Handle new file upload in edit mode
      if (editFile) {
        const fileExt = editFile.name.split('.').pop();
        const filePath = `${session.user.id}/${editingEventId}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('medical_attachments')
          .upload(filePath, editFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('medical_attachments')
          .getPublicUrl(filePath);

        const { error: attachError } = await supabase.from('attachments').insert([{
          event_id: editingEventId,
          file_name: editFile.name,
          file_url: publicUrlData.publicUrl,
          file_type: editFile.type
        }]);
        if (attachError) throw attachError;
      }

      setEditingEventId(null);
      setEditFile(null);
      await fetchData();
    } catch (error) {
      alert('Error updating event: ' + error.message);
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      let profile_picture_url = patient.profile_picture_url;
      if (editProfilePicture) {
        const fileExt = editProfilePicture.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/profiles/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('medical_attachments')
          .upload(filePath, editProfilePicture);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('medical_attachments')
          .getPublicUrl(filePath);
          
        profile_picture_url = publicUrlData.publicUrl;
      }

      const { error } = await supabase
        .from('patients')
        .update({
          name: editData.name,
          dob: editData.dob,
          weight: editData.weight ? parseFloat(editData.weight) : null,
          height: editData.height ? parseFloat(editData.height) : null,
          blood_pressure: editData.blood_pressure,
          allergies: editData.allergies,
          underlying_conditions: editData.underlying_conditions,
          notes: editData.notes,
          profile_picture_url: profile_picture_url,
          measurement_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      setShowEditForm(false);
      setEditProfilePicture(null);
    } catch (error) {
      alert('Error updating patient: ' + error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!window.confirm('คุณต้องการลบโปรไฟล์นี้อย่างถาวรใช่หรือไม่? ข้อมูลประวัติและไฟล์แนบทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้')) return;
    try {
      // 1. Delete timeline event attachments
      const { data: events } = await supabase.from('timeline_events').select('id').eq('patient_id', id);
      const eventIds = events ? events.map(e => e.id) : [];

      if (eventIds.length > 0) {
        const { data: attachments } = await supabase.from('attachments').select('file_url').in('event_id', eventIds);
        if (attachments && attachments.length > 0) {
          const paths = attachments.map(a => {
            const parts = a.file_url.split('medical_attachments/');
            return parts.length > 1 ? parts[1] : null;
          }).filter(Boolean);
          if (paths.length > 0) {
            await supabase.storage.from('medical_attachments').remove(paths);
          }
        }
      }

      // 2. Delete common document attachments
      const { data: commonDocs } = await supabase.from('attachments').select('file_url').eq('patient_id', id).is('event_id', null);
      if (commonDocs && commonDocs.length > 0) {
        const paths = commonDocs.map(a => {
          const parts = a.file_url.split('medical_attachments/');
          return parts.length > 1 ? parts[1] : null;
        }).filter(Boolean);
        if (paths.length > 0) {
          await supabase.storage.from('medical_attachments').remove(paths);
        }
      }

      if (patient.profile_picture_url) {
        const parts = patient.profile_picture_url.split('medical_attachments/');
        const path = parts.length > 1 ? parts[1] : null;
        if (path) {
          await supabase.storage.from('medical_attachments').remove([path]);
        }
      }

      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
      
      navigate('/');
    } catch (error) {
      alert('Error deleting patient: ' + error.message);
    }
  };

  const handleGenerateShareLink = async (e) => {
    e.preventDefault();
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(shareDays));

      const { error } = await supabase
        .from('share_links')
        .insert([{ 
          patient_id: id, 
          created_by: session.user.id,
          token,
          expires_at: expiresAt.toISOString(),
          start_date: filterStartDate || null,
          end_date: filterEndDate || null
        }]);

      if (error) throw error;
      
      const link = `${window.location.origin}/share/${token}`;
      setShareLink(link);
    } catch (error) {
      alert(error.message);
    }
  };

  const fetchCaregivers = async () => {
    try {
      const { data: accessData } = await supabase.from('patient_access').select('*, profiles(email)').eq('patient_id', id);
      setCaregivers(accessData || []);
      
      const { data: invitesData } = await supabase.from('caregiver_invites').select('*').eq('patient_id', id);
      setCaregiverInvites(invitesData || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerateCaregiverInvite = async () => {
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours
      
      const { error } = await supabase.from('caregiver_invites').insert([{
        patient_id: id,
        created_by: session.user.id,
        token,
        expires_at: expiresAt.toISOString()
      }]);
      
      if (error) throw error;
      await fetchCaregivers();
      alert('สร้างลิงก์เชิญสำเร็จ กรุณาคัดลอกลิงก์ที่แสดงด้านล่าง');
    } catch (error) {
      alert('Error generating invite: ' + error.message);
    }
  };

  const handleRevokeCaregiverInvite = async (inviteId) => {
    if (!window.confirm('คุณต้องการยกเลิกลิงก์เชิญนี้ใช่หรือไม่?')) return;
    try {
      await supabase.from('caregiver_invites').delete().eq('id', inviteId);
      await fetchCaregivers();
    } catch (error) {
      alert('Error revoking invite: ' + error.message);
    }
  };

  const handleRemoveCaregiver = async (accessId) => {
    if (!window.confirm('คุณต้องการลบผู้ดูแลคนนี้ใช่หรือไม่? เขาจะไม่สามารถเข้าถึงข้อมูลได้อีกต่อไป')) return;
    try {
      await supabase.from('patient_access').delete().eq('id', accessId);
      await fetchCaregivers();
    } catch (error) {
      alert('Error removing caregiver: ' + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="px-3 py-6 md:p-xl space-y-xl max-w-5xl mx-auto w-full overflow-x-hidden">
      
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-md mb-lg border-b border-border-light pb-lg">
        <div className="w-full min-w-0">
          <button onClick={() => navigate('/')} className="text-text-muted hover:text-primary flex items-center gap-xs font-body-sm text-body-sm transition-colors mb-sm">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            กลับสู่ Dashboard
          </button>
          <div className="flex items-center gap-md">
             <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-primary-container text-primary border-4 border-primary-container flex items-center justify-center font-display text-5xl md:text-6xl font-bold shadow-md shrink-0 overflow-hidden">
                {patient.profile_picture_url ? (
                  <img 
                    src={patient.profile_picture_url} 
                    alt={patient.name} 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                    onClick={() => setSelectedImageModal(patient.profile_picture_url)}
                  />
                ) : (
                  patient.name.charAt(0)
                )}
             </div>
             <div className="flex-1">
                <h1 className="font-headline text-2xl sm:text-3xl md:text-headline font-bold text-on-background leading-tight break-words">{patient.name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-on-surface-variant font-body">
                  <span><strong className="text-on-background">อายุ:</strong> {patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '-'} ปี</span>
                  <span><strong className="text-on-background">น้ำหนัก:</strong> {patient.weight || '-'} กก.</span>
                  <span><strong className="text-on-background">ส่วนสูง:</strong> {patient.height || '-'} ซม.</span>
                  <span><strong className="text-on-background">ความดัน:</strong> {patient.blood_pressure || '-'}</span>
                </div>
                {(patient.allergies || patient.underlying_conditions || patient.notes) && (
                  <div className="flex flex-col gap-1 mt-2 text-sm text-on-surface-variant font-body border-t border-border-light pt-2">
                    {patient.allergies && <span><strong className="text-error">แพ้ยา/อาหาร:</strong> {patient.allergies}</span>}
                    {patient.underlying_conditions && <span><strong className="text-warning">โรคประจำตัว:</strong> {patient.underlying_conditions}</span>}
                    {patient.notes && <span><strong className="text-primary">หมายเหตุ:</strong> <span className="whitespace-pre-wrap">{patient.notes}</span></span>}
                  </div>
                )}
             </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-sm no-print">
          <button 
            onClick={() => setShowEditForm(!showEditForm)}
            className="rounded-full border border-border-medium bg-surface px-md py-sm text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-xs shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span> แก้ไขข้อมูล
          </button>
          {profile?.can_report && (
            <button 
              onClick={() => setShowReportForm(!showReportForm)}
              className="rounded-full border border-border-medium bg-surface px-md py-sm text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-xs shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">print</span> ออกรายงาน
            </button>
          )}
          {profile?.can_share && (
            <button 
              onClick={() => setShowShareForm(!showShareForm)}
              className="rounded-full border border-border-medium bg-surface px-md py-sm text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-xs shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">share</span> แชร์
            </button>
          )}
          {patient?.user_id === session?.user?.id && profile?.can_manage_caregivers && (
            <button 
              onClick={() => { setShowCaregivers(true); fetchCaregivers(); }}
              className="rounded-full bg-primary-container text-on-primary-container px-md py-sm text-sm font-bold hover:bg-[#d6c0d3] transition-colors flex items-center gap-xs shadow-sm border border-primary-container"
            >
              <span className="material-symbols-outlined text-[18px]">group_add</span> จัดการผู้ดูแล
            </button>
          )}
          <button 
            onClick={() => setShowEventForm(!showEventForm)}
            className="bg-primary text-on-primary font-bold rounded-full px-lg py-sm flex items-center justify-center gap-xs hover:bg-[#C026D3] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> เพิ่มเหตุการณ์
          </button>
        </div>
      </div>

      {/* Edit Form Section */}
      {showEditForm && (
        <form onSubmit={handleUpdatePatient} className="mb-lg rounded-2xl border border-border-light bg-surface p-lg shadow-sm animate-in fade-in slide-in-from-top-4 no-print">
          <h3 className="mb-md text-lg font-subhead font-bold text-on-background flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">edit_square</span> แก้ไขข้อมูลส่วนตัว
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="sm:col-span-2">
              <label className="font-caption text-caption text-on-surface block mb-1">เปลี่ยนรูปโปรไฟล์ (ไม่บังคับ)</label>
              <input type="file" accept="image/*" onChange={e => setEditProfilePicture(e.target.files[0])} className="w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-primary hover:file:bg-primary hover:file:text-white transition-colors" />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">ชื่อ-นามสกุล / ชื่อเล่น</label>
              <input type="text" required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">วันเกิด</label>
              <ThaiDatePicker 
                value={editData.dob} 
                onChange={dob => setEditData({...editData, dob})} 
                className="w-full"
              />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">น้ำหนัก (กก.)</label>
              <input type="number" step="0.1" value={editData.weight} onChange={e => setEditData({...editData, weight: e.target.value})} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">ส่วนสูง (ซม.)</label>
              <input type="number" step="0.1" value={editData.height} onChange={e => setEditData({...editData, height: e.target.value})} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">ความดันโลหิต (เช่น 120/80)</label>
              <input type="text" value={editData.blood_pressure} onChange={e => setEditData({...editData, blood_pressure: e.target.value})} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-caption text-caption text-on-surface block mb-1">ประวัติแพ้ยา / อาหาร (ระบุถ้ามี)</label>
              <input type="text" value={editData.allergies} onChange={e => setEditData({...editData, allergies: e.target.value})} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-caption text-caption text-on-surface block mb-1">โรคประจำตัว (ระบุถ้ามี)</label>
              <input type="text" value={editData.underlying_conditions} onChange={e => setEditData({...editData, underlying_conditions: e.target.value})} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-caption text-caption text-on-surface block mb-1">หมายเหตุ (HN, AN, ประวัติสำคัญ ฯลฯ)</label>
              <textarea rows="3" value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia"></textarea>
            </div>
          </div>
          <div className="mt-md flex justify-between gap-3">
            <div>
              {patient?.user_id === session?.user?.id && (
                <button type="button" onClick={handleDeletePatient} className="rounded-full bg-error/10 px-6 py-2 text-sm font-bold text-error hover:bg-error/20 transition-colors">ลบโปรไฟล์ทิ้ง</button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowEditForm(false)} className="rounded-full border border-border-medium bg-surface px-6 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors">ยกเลิก</button>
              <button type="submit" disabled={updatingProfile} className="rounded-full bg-brand-fuchsia px-6 py-2 text-sm font-bold text-on-primary shadow-sm hover:bg-primary transition-colors disabled:opacity-50">
                {updatingProfile ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Share Form Section */}
      {showShareForm && (
        <div className="rounded-2xl border border-border-light bg-surface-container-low p-md shadow-sm mb-lg animate-in fade-in slide-in-from-top-4 no-print">
          <h3 className="mb-md text-lg font-subhead font-bold text-on-background flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">link</span> สร้างลิงก์แชร์ประวัติ
          </h3>
          {!shareLink ? (
            <form onSubmit={handleGenerateShareLink} className="flex flex-col sm:flex-row items-end gap-md">
              <div className="flex-1 w-full">
                <label className="font-caption text-caption text-on-surface block mb-1">ระยะเวลาที่แชร์ (วัน)</label>
                <select value={shareDays} onChange={(e) => setShareDays(e.target.value)} className="w-full rounded-xl border-border-medium bg-surface px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia">
                  <option value={1}>1 วัน</option>
                  <option value={7}>7 วัน</option>
                  <option value={30}>30 วัน</option>
                </select>
              </div>
              <button type="submit" className="w-full sm:w-auto rounded-full bg-brand-fuchsia px-6 py-2 text-sm font-bold text-on-primary shadow-sm hover:bg-primary transition-colors">
                สร้างลิงก์
              </button>
            </form>
          ) : (
            <div className="mt-4 flex flex-col items-center sm:items-start gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm border border-border-light inline-block">
                <QRCode value={shareLink} size={150} />
              </div>
              <div className="w-full p-md bg-surface border border-border-medium rounded-xl flex items-center justify-between gap-md">
                <input type="text" readOnly value={shareLink} className="flex-1 bg-transparent outline-none font-code text-body-sm text-on-surface" />
                <button 
                  onClick={() => navigator.clipboard.writeText(shareLink)}
                  className="text-primary hover:text-brand-fuchsia font-bold text-sm px-4 py-1 rounded-full bg-primary-container/20 transition-colors shrink-0"
                >
                  คัดลอก
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Form Section */}
      {showReportForm && (
        <div className="rounded-2xl border border-border-light bg-surface-container-low p-md shadow-sm mb-lg animate-in fade-in slide-in-from-top-4 no-print flex flex-col sm:flex-row justify-between items-center gap-md">
          <h3 className="text-lg font-subhead font-bold text-on-background flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">print</span> ออกรายงานประวัติสุขภาพ
          </h3>
          <p className="text-sm text-text-muted flex-1 text-center sm:text-left">
            รายงานจะพิมพ์เฉพาะเหตุการณ์ตามช่วงเวลาที่กำหนดในตัวกรองด้านล่าง
          </p>
          <button onClick={() => window.print()} className="w-full sm:w-auto rounded-full bg-primary px-6 py-2 text-sm font-bold text-on-primary shadow-sm hover:bg-[#C026D3] transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">print</span>
            พิมพ์รายงาน
          </button>
        </div>
      )}

      {/* Add Event Form */}
      {showEventForm && (
        <form onSubmit={handleCreateEvent} className="mb-lg rounded-2xl border border-border-light bg-surface p-lg shadow-sm animate-in fade-in slide-in-from-top-4 no-print">
          <h3 className="mb-md text-lg font-subhead font-bold text-on-background flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">event_note</span> บันทึกเหตุการณ์ใหม่
          </h3>
          <div className="grid grid-cols-1 gap-md">
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">หัวข้อเหตุการณ์ (เช่น พบแพทย์, ตรวจเลือด)</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">วันที่</label>
              <ThaiDatePicker 
                required 
                value={eventDate} 
                onChange={setEventDate} 
                className="w-full"
              />
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">รายละเอียด</label>
              <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia"></textarea>
            </div>
            <div>
              <label className="font-caption text-caption text-on-surface block mb-1">แนบไฟล์ (รูปภาพ, ใบเสร็จ, ผลตรวจ)</label>
              <input type="file" onChange={e => setFile(e.target.files[0])} className="w-full text-body-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-primary hover:file:bg-primary hover:file:text-white transition-colors" />
            </div>

            {/* Customization Options */}
            <div className="border border-border-light rounded-xl p-md bg-surface-container-low mt-2">
              <div className="flex justify-between items-center mb-3">
                <label className="font-caption text-caption text-on-surface font-bold">ปรับแต่งรูปแบบการ์ด</label>
                <button 
                  type="button" 
                  onClick={() => { setCardColor('#fef7ff'); setTextColor('#832890'); setIcon('medical_information'); }} 
                  className="text-xs text-brand-fuchsia hover:underline font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span> ค่าเริ่มต้น
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-lg">
                <div className="flex-1">
                  <label className="text-xs text-text-muted block mb-1">สีพื้นหลัง</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={cardColor} onChange={e => setCardColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                    <span className="text-xs font-code">{cardColor}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-muted block mb-1">สีตัวอักษรหลัก</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                    <span className="text-xs font-code">{textColor}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="text-xs text-text-muted block mb-2">เลือกไอคอนสัญลักษณ์</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {MEDICAL_ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${icon === ic ? 'bg-brand-fuchsia text-white border-brand-fuchsia' : 'bg-surface border-border-medium text-text-muted hover:bg-surface-container-high'}`}
                      title={ic}
                    >
                      <span className="material-symbols-outlined text-[20px]">{ic}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted whitespace-nowrap">ไอคอนอื่นๆ:</span>
                    <input type="text" value={icon} onChange={e => setIcon(e.target.value)} placeholder="เช่น favorite, home, directions_car" className="flex-1 rounded-xl border-border-medium bg-background px-3 py-1.5 shadow-sm text-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
                  </div>
                  <a href="https://fonts.google.com/icons?icon.set=Material+Symbols" target="_blank" rel="noreferrer" className="text-[11px] text-brand-fuchsia hover:underline text-right flex justify-end items-center gap-1">
                    ค้นหาชื่อไอคอนเพิ่มเติมได้ที่ Google Material Symbols <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-on-surface">
              <input 
                type="checkbox" 
                checked={isHiddenFromShare} 
                onChange={(e) => setIsHiddenFromShare(e.target.checked)}
                className="w-4 h-4 rounded text-brand-fuchsia focus:ring-brand-fuchsia"
              />
              <span className="material-symbols-outlined text-[20px] text-text-muted">visibility_off</span>
              ซ่อนเหตุการณ์นี้จากลิงก์แชร์
            </label>
            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <button type="button" onClick={() => setShowEventForm(false)} className="rounded-full border border-border-medium bg-surface px-6 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors">ยกเลิก</button>
              <button type="submit" disabled={uploading} className="rounded-full bg-brand-fuchsia px-6 py-2 text-sm font-bold text-on-primary shadow-sm hover:bg-primary transition-colors disabled:opacity-50">
                {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Patient Attachments Section (Common Documents) */}
      <div className="bg-surface rounded-2xl md:rounded-[24px] border border-border-light p-3 md:p-xl shadow-sm mt-lg w-full no-print overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-md">
          <h3 className="text-lg font-subhead font-bold text-on-background flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">folder_open</span> เอกสารประจำตัว (Common Documents)
          </h3>
          <form onSubmit={handleUploadPatientAttachment} className="flex gap-2 w-full sm:w-auto">
            <input type="file" required onChange={e => setPatientFile(e.target.files[0])} className="w-full sm:w-auto text-xs text-text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-primary-container file:text-primary hover:file:bg-primary hover:file:text-white transition-colors" />
            <button type="submit" disabled={uploadingPatientFile || !patientFile} className="rounded-full bg-brand-fuchsia px-4 py-1.5 text-xs font-bold text-on-primary shadow-sm hover:bg-primary transition-colors disabled:opacity-50 shrink-0">
              {uploadingPatientFile ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
            </button>
          </form>
        </div>
        
        {patientAttachments.length === 0 ? (
          <p className="text-sm text-text-muted italic">ยังไม่มีเอกสารแนบ</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {patientAttachments.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 border border-border-light rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors shadow-sm">
                <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0 hover:text-brand-fuchsia group">
                  <span className="material-symbols-outlined text-text-muted group-hover:text-brand-fuchsia text-[20px]">
                    {file.file_type?.startsWith('image/') ? 'image' : 'description'}
                  </span>
                  <span className="text-sm font-medium truncate">{file.file_name || 'เอกสาร'}</span>
                </a>
                <button onClick={() => handleDeleteAttachment(file.id, file.file_url)} className="text-text-muted hover:text-error transition-colors p-1 shrink-0 ml-2" title="ลบ">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="bg-surface rounded-2xl md:rounded-[24px] border border-border-light p-3 md:p-xl shadow-sm mt-lg w-full overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
          <h2 className="font-subhead text-[18px] sm:text-subhead font-bold text-on-background flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">timeline</span> ประวัติสุขภาพ (Timeline)
          </h2>
          
          {/* Timeline Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-surface-container-low p-3 md:px-4 rounded-2xl border border-border-medium no-print w-full md:w-auto max-w-full overflow-hidden">
            <div className="flex items-center gap-2 text-text-muted font-bold text-sm shrink-0">
              <span className="material-symbols-outlined text-[20px]">filter_alt</span> กรองข้อมูล
            </div>
            
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm font-medium text-on-surface text-right w-12 shrink-0">ตั้งแต่:</span>
                <div className="flex-1 min-w-0">
                  <ThaiDatePicker 
                    value={filterStartDate} 
                    onChange={setFilterStartDate} 
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm font-medium text-on-surface text-right w-12 shrink-0">ถึง:</span>
                <div className="flex-1 min-w-0">
                  <ThaiDatePicker 
                    value={filterEndDate} 
                    onChange={setFilterEndDate} 
                  />
                </div>
              </div>
            </div>
            
            {(filterStartDate || filterEndDate) && (
              <button 
                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} 
                className="text-sm text-error hover:underline px-2 font-bold shrink-0 self-end lg:self-center mt-2 lg:mt-0"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
        
        {events.filter(event => {
          if (filterStartDate && new Date(event.event_date) < new Date(filterStartDate)) return false;
          if (filterEndDate && new Date(event.event_date) > new Date(filterEndDate + 'T23:59:59')) return false;
          return true;
        }).length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border-medium p-12 text-center bg-surface-container-low">
             <span className="material-symbols-outlined text-[48px] text-text-muted mb-4 opacity-50">history</span>
             <p className="text-text-muted font-body">ไม่พบประวัติการรักษาในช่วงเวลาที่กำหนด</p>
          </div>
        ) : (
          <div className="relative pl-sm md:pl-md">
            {/* Vertical Timeline Line */}
            <div className="absolute top-4 bottom-4 left-[21px] md:left-[29px] w-0.5 bg-border-light"></div>
            
            <div className="space-y-xl">
              {events.filter(event => {
                if (filterStartDate && new Date(event.event_date) < new Date(filterStartDate)) return false;
                if (filterEndDate && new Date(event.event_date) > new Date(filterEndDate + 'T23:59:59')) return false;
                return true;
              }).map((event, index) => (
                <div key={event.id} className="relative flex gap-md md:gap-xl items-start group">
                  {/* Timeline Dot */}
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full text-white flex items-center justify-center shrink-0 z-10 border-4 border-surface shadow-md mt-4" style={{ backgroundColor: event.text_color || '#c026d3' }}>
                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">{event.icon || 'medical_information'}</span>
                  </div>
                  
                  {/* Event Content Card */}
                  <div className="flex-1 min-w-0 border border-border-light rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden" style={{ backgroundColor: event.card_color || '#fef7ff' }}>
                    {/* Big Date Header */}
                    <div className="px-3 md:px-md py-3 border-b border-border-light/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                      <h3 className="font-headline text-[15px] sm:text-lg font-bold flex items-start sm:items-center gap-xs leading-snug" style={{ color: event.text_color || '#832890' }}>
                        <span className="material-symbols-outlined shrink-0">{event.icon || 'calendar_today'}</span>
                        <span className="break-words">{formatThaiDateFull(event.event_date)}</span>
                      </h3>
                      {editingEventId !== event.id && (
                        <div className="flex gap-2 no-print">
                          <button onClick={() => handleStartEditEvent(event)} className="text-text-muted hover:text-primary transition-colors p-1" title="แก้ไข">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteEvent(event.id)} className="text-text-muted hover:text-error transition-colors p-1" title="ลบ">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-md md:p-lg">
                      {editingEventId === event.id ? (
                        <form onSubmit={handleUpdateEvent} className="space-y-4 animate-in fade-in">
                          <div>
                            <label className="font-caption text-caption text-on-surface block mb-1">หัวข้อเหตุการณ์</label>
                            <input type="text" required value={editEventData.title} onChange={e => setEditEventData({...editEventData, title: e.target.value})} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
                          </div>
                          <div>
                            <label className="font-caption text-caption text-on-surface block mb-1">วันที่</label>
                            <ThaiDatePicker 
                              required 
                              value={editEventData.event_date} 
                              onChange={date => setEditEventData({...editEventData, event_date: date})} 
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="font-caption text-caption text-on-surface block mb-1">รายละเอียด</label>
                            <textarea rows="3" value={editEventData.description} onChange={e => setEditEventData({...editEventData, description: e.target.value})} className="w-full rounded-xl border-border-medium bg-background px-3 py-2 shadow-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia"></textarea>
                          </div>
                          
                          <div className="border-t border-border-light pt-4 mt-2">
                            <label className="font-caption text-caption text-on-surface block mb-2">ไฟล์แนบที่มีอยู่</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {event.attachments && event.attachments.length > 0 ? (
                                event.attachments.map(attachment => (
                                  <div key={attachment.id} className="flex items-center gap-2 px-3 py-1 bg-surface-container-low border border-border-medium rounded-lg text-sm">
                                    <a href={attachment.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{attachment.file_name}</a>
                                    <button type="button" onClick={() => handleDeleteAttachment(attachment.id, attachment.file_url)} className="text-error hover:text-red-700 p-1 rounded-full hover:bg-red-50" title="ลบไฟล์">
                                      <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-text-muted">ไม่มีไฟล์แนบ</p>
                              )}
                            </div>
                            
                            <label className="font-caption text-caption text-on-surface block mb-1">เพิ่มไฟล์แนบใหม่ (ไม่บังคับ)</label>
                            <input type="file" onChange={e => setEditFile(e.target.files[0])} className="w-full text-body-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-primary hover:file:bg-primary hover:file:text-white transition-colors" />
                          </div>

                          {/* Customization Options */}
                          <div className="border border-border-light rounded-xl p-md bg-surface-container-low mt-2">
                            <div className="flex justify-between items-center mb-3">
                              <label className="font-caption text-caption text-on-surface font-bold">ปรับแต่งรูปแบบการ์ด</label>
                              <button 
                                type="button" 
                                onClick={() => setEditEventData({...editEventData, card_color: '#fef7ff', text_color: '#832890', icon: 'medical_information'})} 
                                className="text-xs text-brand-fuchsia hover:underline font-bold flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">refresh</span> ค่าเริ่มต้น
                              </button>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-lg">
                              <div className="flex-1">
                                <label className="text-xs text-text-muted block mb-1">สีพื้นหลัง</label>
                                <div className="flex items-center gap-2">
                                  <input type="color" value={editEventData.card_color} onChange={e => setEditEventData({...editEventData, card_color: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                                  <span className="text-xs font-code">{editEventData.card_color}</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-text-muted block mb-1">สีตัวอักษรหลัก</label>
                                <div className="flex items-center gap-2">
                                  <input type="color" value={editEventData.text_color} onChange={e => setEditEventData({...editEventData, text_color: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                                  <span className="text-xs font-code">{editEventData.text_color}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <label className="text-xs text-text-muted block mb-2">เลือกไอคอนสัญลักษณ์</label>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {MEDICAL_ICONS.map(ic => (
                                  <button
                                    key={ic}
                                    type="button"
                                    onClick={() => setEditEventData({...editEventData, icon: ic})}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${editEventData.icon === ic ? 'bg-brand-fuchsia text-white border-brand-fuchsia' : 'bg-surface border-border-medium text-text-muted hover:bg-surface-container-high'}`}
                                    title={ic}
                                  >
                                    <span className="material-symbols-outlined text-[20px]">{ic}</span>
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-text-muted whitespace-nowrap">ไอคอนอื่นๆ:</span>
                                <input type="text" value={editEventData.icon} onChange={e => setEditEventData({...editEventData, icon: e.target.value})} placeholder="ชื่อ Material Symbol" className="flex-1 rounded-xl border-border-medium bg-background px-3 py-1.5 shadow-sm text-sm focus:border-brand-fuchsia focus:ring-1 focus:ring-brand-fuchsia" />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-on-surface">
                              <input 
                                type="checkbox" 
                                checked={editEventData.is_hidden_from_share} 
                                onChange={(e) => setEditEventData({...editEventData, is_hidden_from_share: e.target.checked})}
                                className="w-4 h-4 rounded text-brand-fuchsia focus:ring-brand-fuchsia"
                              />
                              <span className="material-symbols-outlined text-[20px] text-text-muted">visibility_off</span>
                              ซ่อนเหตุการณ์นี้จากลิงก์แชร์
                            </label>
                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                              <button type="button" onClick={() => setEditingEventId(null)} className="px-4 py-2 rounded-full border border-border-medium text-sm font-bold hover:bg-surface-container-high transition-colors">ยกเลิก</button>
                              <button type="submit" className="px-4 py-2 rounded-full bg-brand-fuchsia text-white text-sm font-bold shadow-sm hover:bg-primary transition-colors">บันทึก</button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-sm">
                            <h4 className="font-subhead text-xl font-bold text-on-background">{event.title}</h4>
                            {event.is_hidden_from_share && (
                              <span className="flex items-center gap-1 text-xs font-bold text-text-muted bg-surface-container-high px-2 py-1 rounded-md" title="เหตุการณ์นี้ถูกซ่อนในลิงก์แชร์">
                                <span className="material-symbols-outlined text-[14px]">visibility_off</span> ซ่อนอยู่
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="font-body text-body text-on-surface-variant mb-md whitespace-pre-wrap">{event.description}</p>
                          )}
                          
                          {/* Attachments */}
                          {event.attachments && event.attachments.length > 0 && (
                            <div className="mt-md pt-md border-t border-border-light border-dashed">
                              <p className="font-subhead font-bold text-on-background mb-3 flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[18px] text-primary">attach_file</span> เอกสารแนบ
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {event.attachments.map(attachment => (
                                  <a 
                                    key={attachment.id} 
                                    href={attachment.file_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-container/30 border border-primary/20 rounded-xl text-sm font-bold text-primary hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm group/btn"
                                  >
                                    <span className="material-symbols-outlined text-[20px] group-hover/btn:scale-110 transition-transform">description</span>
                                    ดูเอกสาร {attachment.file_name}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Caregivers Modal */}
      {showCaregivers && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl p-md md:p-xl w-full max-w-[500px] min-w-[300px] shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCaregivers(false)} className="absolute top-4 right-4 text-text-muted hover:text-on-surface p-2 rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-subhead font-display font-bold text-on-background mb-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              จัดการผู้ดูแลร่วม
            </h2>
            
            <p className="text-sm text-text-muted mb-md">
              ผู้ดูแลร่วมจะสามารถเห็นและเพิ่มเหตุการณ์ต่างๆ ของผู้ป่วยคนนี้ได้ (เพื่อช่วยกันจดบันทึก)
            </p>

            <div className="mb-lg">
              <button onClick={handleGenerateCaregiverInvite} className="w-full bg-primary hover:bg-[#7c008e] text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">link</span>
                สร้างลิงก์เชิญผู้ดูแล (หมดอายุใน 24 ชม.)
              </button>
            </div>

            {caregiverInvites.length > 0 && (
              <div className="mb-lg">
                <h3 className="font-bold text-on-surface mb-sm">ลิงก์เชิญที่ยังใช้งานได้:</h3>
                <div className="space-y-sm">
                  {caregiverInvites.map(invite => {
                    const inviteUrl = `${window.location.origin}/join/${invite.token}`;
                    return (
                      <div key={invite.id} className="bg-surface-container-lowest border border-border-light rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs text-text-muted">
                          <span>หมดอายุ: {new Date(invite.expires_at).toLocaleString('th-TH')}</span>
                          <button onClick={() => handleRevokeCaregiverInvite(invite.id)} className="text-error hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">delete</span> ยกเลิก
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input type="text" readOnly value={inviteUrl} className="flex-1 text-xs border border-border-light rounded-md px-2 py-1 bg-surface-variant text-text-muted" />
                          <button onClick={() => { navigator.clipboard.writeText(inviteUrl); alert('คัดลอกลิงก์แล้ว'); }} className="bg-surface-container-high px-2 py-1 rounded-md text-xs font-bold hover:bg-surface-variant transition-colors">คัดลอก</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-bold text-on-surface mb-sm">ผู้ดูแลปัจจุบัน:</h3>
              {caregivers.length === 0 ? (
                <p className="text-sm text-text-muted italic bg-surface-container-low p-4 rounded-xl text-center">ยังไม่มีผู้ดูแลร่วม</p>
              ) : (
                <div className="space-y-2">
                  {caregivers.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-border-light">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">
                          {c.profiles?.email ? c.profiles.email.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="text-sm font-bold text-on-surface">{c.profiles?.email || 'Unknown User'}</div>
                      </div>
                      <button onClick={() => handleRemoveCaregiver(c.id)} className="text-error hover:bg-error-container p-1 rounded-md transition-colors" title="ลบผู้ดูแล">
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}



      {/* Image Modal */}
      {selectedImageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200" 
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex justify-center">
            <button 
              className="absolute -top-12 right-0 md:-right-12 text-white hover:text-brand-fuchsia transition-colors" 
              onClick={() => setSelectedImageModal(null)}
            >
              <span className="material-symbols-outlined text-4xl">close</span>
            </button>
            <img 
              src={selectedImageModal} 
              alt="Full screen" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" 
              onClick={e => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

    </div>
  );
}
