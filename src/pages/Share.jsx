import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatThaiDateFull } from '../utils/date';

export default function Share() {
  const { token } = useParams();
  const [patient, setPatient] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSharedData();
  }, [token]);

  const fetchSharedData = async () => {
    try {
      // 1. Validate Token
      const { data: linkData, error: linkError } = await supabase
        .from('share_links')
        .select('*')
        .eq('token', token)
        .single();

      if (linkError || !linkData) throw new Error('ลิงก์ไม่ถูกต้องหรือไม่มีอยู่จริง');
      
      if (new Date(linkData.expires_at) < new Date()) {
        throw new Error('ลิงก์แชร์นี้หมดอายุแล้ว');
      }

      // 2. Fetch Patient Data (using public policy)
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', linkData.patient_id)
        .single();
        
      if (patientError) throw patientError;
      setPatient(patientData);

      // 3. Fetch Events & Attachments
      let eventsQuery = supabase
        .from('timeline_events')
        .select(`*, attachments(*)`)
        .eq('patient_id', linkData.patient_id)
        .order('event_date', { ascending: false });

      if (linkData.start_date) {
        eventsQuery = eventsQuery.gte('event_date', linkData.start_date);
      }
      if (linkData.end_date) {
        // Append time to end_date to include the whole day
        eventsQuery = eventsQuery.lte('event_date', linkData.end_date + 'T23:59:59');
      }

      const { data: eventsData, error: eventsError } = await eventsQuery;

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background font-body text-text-muted">กำลังโหลดข้อมูล...</div>;

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background font-body p-md">
        <div className="w-full max-w-[400px] min-w-[280px] rounded-3xl bg-surface p-xl text-center shadow-lg border border-border-light relative overflow-hidden mx-auto">
          <div className="absolute top-0 left-0 right-0 h-2 bg-error"></div>
          <span className="material-symbols-outlined text-[64px] text-error mb-md opacity-80">link_off</span>
          <h2 className="text-subhead font-display font-bold text-on-background mb-sm">ไม่สามารถเข้าถึงข้อมูลได้</h2>
          <p className="text-body text-text-muted mb-lg">{error}</p>
          <Link to="/" className="inline-block rounded-full bg-surface-container-high px-6 py-2 font-bold text-on-surface-variant hover:bg-surface-variant transition-colors">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body text-body text-on-background pt-xl pb-32">
      <div className="max-w-4xl mx-auto px-md">
        
        {/* Header Section */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border-light overflow-hidden mb-lg relative">
          <div className="h-32 bg-primary-container relative overflow-hidden">
             <div className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-multiply" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')" }}></div>
          </div>
          <div className="px-lg pb-lg pt-0 relative">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-surface border-4 border-surface shadow-md -mt-12 md:-mt-16 flex items-center justify-center mb-md font-display text-5xl md:text-6xl font-bold text-primary overflow-hidden">
              {patient.profile_picture_url ? (
                <img src={patient.profile_picture_url} alt={patient.name} className="w-full h-full object-cover" />
              ) : (
                patient.name.charAt(0)
              )}
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
              <div>
                <h1 className="font-headline text-headline font-bold text-on-background">{patient.name}</h1>
                <p className="font-body-lg text-text-muted mt-1">ประวัติสุขภาพ (ข้อมูลแบบอ่านอย่างเดียว)</p>
                {(patient.allergies || patient.underlying_conditions || patient.notes) && (
                  <div className="mt-3 flex flex-col gap-1 text-sm font-body">
                    {patient.allergies && <span className="text-error"><strong className="text-on-surface-variant">แพ้ยา/อาหาร:</strong> {patient.allergies}</span>}
                    {patient.underlying_conditions && <span className="text-warning"><strong className="text-on-surface-variant">โรคประจำตัว:</strong> {patient.underlying_conditions}</span>}
                    {patient.notes && <span><strong className="text-primary">หมายเหตุ:</strong> <span className="whitespace-pre-wrap">{patient.notes}</span></span>}
                  </div>
                )}
              </div>
              <div className="bg-surface-container-low border border-border-light rounded-xl p-md flex flex-wrap gap-lg">
                <div>
                  <div className="font-caption text-caption text-text-muted mb-xs">อายุ</div>
                  <div className="font-bold text-on-background">{patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '-'} ปี</div>
                </div>
                <div>
                  <div className="font-caption text-caption text-text-muted mb-xs">น้ำหนัก</div>
                  <div className="font-bold text-on-background">{patient.weight || '-'} กก.</div>
                </div>
                <div>
                  <div className="font-caption text-caption text-text-muted mb-xs">ส่วนสูง</div>
                  <div className="font-bold text-on-background">{patient.height || '-'} ซม.</div>
                </div>
                <div>
                  <div className="font-caption text-caption text-text-muted mb-xs">ความดัน</div>
                  <div className="font-bold text-on-background">{patient.blood_pressure || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-surface rounded-[24px] border border-border-light p-md md:p-xl shadow-sm">
          <h2 className="font-subhead text-subhead font-bold text-on-background mb-lg flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">timeline</span> ประวัติการรักษา
          </h2>
          
          {events.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border-medium p-12 text-center bg-surface-container-low">
               <p className="text-text-muted font-body">ไม่มีข้อมูลประวัติการรักษา</p>
            </div>
          ) : (
            <div className="relative pl-sm md:pl-md">
              {/* Vertical Timeline Line */}
              <div className="absolute top-4 bottom-4 left-[21px] md:left-[29px] w-0.5 bg-border-light"></div>
              
              <div className="space-y-xl">
                {events.map((event) => (
                  <div key={event.id} className="relative flex gap-md md:gap-xl items-start">
                    {/* Timeline Dot */}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full text-white flex items-center justify-center shrink-0 z-10 border-4 border-surface shadow-sm mt-4" style={{ backgroundColor: event.text_color || '#c026d3' }}>
                      <span className="material-symbols-outlined text-[20px] md:text-[24px]">{event.icon || 'medical_information'}</span>
                    </div>
                    
                    {/* Event Content Card */}
                    <div className="flex-1 border border-border-light rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: event.card_color || '#fef7ff' }}>
                      {/* Big Date Header */}
                      <div className="px-md py-3 border-b border-border-light/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                        <h3 className="font-headline text-lg font-bold flex items-center gap-xs" style={{ color: event.text_color || '#832890' }}>
                          <span className="material-symbols-outlined">{event.icon || 'calendar_today'}</span>
                          {formatThaiDateFull(event.event_date)}
                        </h3>
                      </div>

                    <div className="p-md md:p-lg">
                      <h4 className="font-subhead text-xl font-bold text-on-background mb-sm">{event.title}</h4>
                      
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
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
