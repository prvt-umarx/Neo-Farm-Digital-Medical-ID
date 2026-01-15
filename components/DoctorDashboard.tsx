
import React, { useState } from 'react';
import { UserProfile, Role, Diagnosis, Prescription, Language, ClinicDoctor, AvailabilityStatus, Appointment, AppointmentStatus } from '../types';
import { translations } from '../translations';
import { getPatientSummary } from '../services/geminiService';
import QRScanner from './QRScanner';

interface Props {
  patientData: UserProfile;
  updatePatientData: (data: UserProfile) => void;
  lang: Language;
  clinicDoctors: ClinicDoctor[];
  setClinicDoctors: (docs: ClinicDoctor[]) => void;
  appointments: Appointment[];
  setAppointments: (apps: Appointment[]) => void;
}

const DoctorDashboard: React.FC<Props> = ({ patientData, updatePatientData, lang, clinicDoctors, setClinicDoctors, appointments, setAppointments }) => {
  const [activeTab, setActiveTab] = useState<'reception' | 'appointments' | 'profile'>('reception');
  const [isScanning, setIsScanning] = useState(false);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [scannedPatientId, setScannedPatientId] = useState<string | null>(null);
  
  const t = translations[lang];
  const LOGGED_IN_DOC_ID = "cd1"; // Simulating logged in doctor ID
  const currentDoc = clinicDoctors.find(d => d.id === LOGGED_IN_DOC_ID) || clinicDoctors[0];

  // Appointment Logic
  const doctorAppointments = appointments.filter(app => app.doctorId === LOGGED_IN_DOC_ID);
  
  const handleUpdateAppointmentStatus = (appId: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    );
    setAppointments(updated);
  };

  const handleScanSuccess = (decodedId: string) => {
    setIsScanning(false);
    setScannedPatientId(decodedId);
    const newLog = { 
      id: Math.random().toString(36).substr(2, 9), 
      accessorName: `${currentDoc.name} (${currentDoc.clinicName || 'Clinic'})`, 
      role: Role.DOCTOR, 
      timestamp: new Date().toISOString() 
    };
    updatePatientData({ ...patientData, accessLog: [newLog, ...patientData.accessLog] });
    setAiSummary(null);
  };

  const generateSummary = async () => {
    setIsSummarizing(true);
    const summary = await getPatientSummary(patientData, lang);
    setAiSummary(summary);
    updatePatientData({ ...patientData, aiSummary: summary });
    setIsSummarizing(false);
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleString(lang === Language.RU ? 'ru-RU' : 'uz-UZ', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
    } catch (e) { return ts; }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Role-Specific Nav */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-[24px] shadow-inner backdrop-blur-sm border border-slate-200/50 max-w-md mx-auto">
        {(['reception', 'appointments', 'profile'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[18px] transition-all duration-300 ${activeTab === tab ? 'bg-emerald-600 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-white/50'}`}
          >
            {tab === 'reception' && <><i className="fas fa-stethoscope mr-2"></i>{lang === 'ru' ? 'Прием' : 'Qabul'}</>}
            {tab === 'appointments' && <><i className="fas fa-calendar mr-2"></i>{lang === 'ru' ? 'Записи' : 'Yozuvlar'}</>}
            {tab === 'profile' && <><i className="fas fa-user-circle mr-2"></i>{lang === 'ru' ? 'Профиль' : 'Profil'}</>}
          </button>
        ))}
      </div>

      {activeTab === 'reception' && (
        <div className="space-y-8">
          {isScanning && <QRScanner lang={lang} onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}

          {!scannedPatientId && !isScanning && (
            <div className="text-center py-24 flex flex-col items-center animate-in zoom-in-95 duration-700">
              <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-[40px] flex items-center justify-center text-5xl mb-10 shadow-2xl shadow-emerald-100 border-4 border-white rotate-3 group-hover:rotate-0 transition-transform">
                <i className="fas fa-id-card-clip"></i>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-4">{lang === 'ru' ? 'Прием пациента' : 'Bemor qabuli'}</h2>
              <p className="text-slate-500 mb-12 max-w-md font-medium text-lg leading-relaxed opacity-80">{lang === 'ru' ? 'Для доступа к медицинской карте, пожалуйста, отсканируйте QR-код на устройстве пациента' : 'Tibbiy kartaga kirish uchun bemor qurilmasidagi QR-kodni skanerlang'}</p>
              <button onClick={() => setIsScanning(true)} className="px-12 py-6 bg-emerald-600 text-white rounded-[32px] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 text-xl font-black tracking-tight">
                <i className="fas fa-qrcode text-3xl"></i>
                {t.scanQR}
              </button>
            </div>
          )}

          {scannedPatientId && !isScanning && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <section className="bg-white rounded-[32px] p-8 border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-2xl shadow-slate-200/50 group">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center text-3xl border border-emerald-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <i className="fas fa-user-injured"></i>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-black text-slate-900 leading-none mb-2">{patientData.name} {patientData.surname}</h2>
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patientData.birthDate}</span>
                      <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                      <span className="text-red-500 font-black text-xs bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest border border-red-100/50">{patientData.bloodType}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={generateSummary} disabled={isSummarizing} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95">
                    <i className="fas fa-wand-magic-sparkles"></i>{isSummarizing ? t.analyzing : t.smartSummary}
                  </button>
                  <button onClick={() => setScannedPatientId(null)} className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all duration-300 shadow-inner"><i className="fas fa-power-off"></i></button>
                </div>
              </section>

              {(aiSummary || patientData.aiSummary) && (
                <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-x-[-30%] -translate-y-[-30%] blur-3xl opacity-50"></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md border border-white/30"><i className="fas fa-brain"></i></div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-100">Patient AI Profile</span>
                  </div>
                  <p className="text-base leading-relaxed font-medium bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-sm relative z-10">
                    {aiSummary || patientData.aiSummary}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><i className="fas fa-stethoscope"></i></div>
                         <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{t.diagnoses}</h3>
                       </div>
                    </div>
                    <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
                       {patientData.diagnoses.map(d => (
                         <div key={d.id} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-2">
                               <span className="font-black text-slate-900 text-base">{d.condition}</span>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{new Date(d.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">"{d.notes}"</p>
                         </div>
                       ))}
                    </div>
                 </section>

                 <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><i className="fas fa-pills"></i></div>
                         <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{t.prescriptions}</h3>
                       </div>
                    </div>
                    <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
                       {patientData.prescriptions.map(p => (
                         <div key={p.id} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                            <div className="flex justify-between items-center mb-3">
                               <span className="font-black text-slate-900 text-base uppercase tracking-tight">{p.medication}</span>
                               <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border ${p.isFilled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{p.isFilled ? t.filled : t.notFilled}</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.dosage} • {p.duration}</p>
                         </div>
                       ))}
                    </div>
                 </section>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
           <h3 className="text-2xl font-black text-slate-900">{t.appointments}</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {doctorAppointments.length > 0 ? (
               doctorAppointments.map(app => (
                 <div key={app.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all group">
                   <div>
                     <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                           <i className="fas fa-user"></i>
                         </div>
                         <div>
                           <h4 className="font-black text-slate-900 text-lg leading-none mb-1">{app.patientName}</h4>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.specialty}</span>
                         </div>
                       </div>
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                         app.status === AppointmentStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                         app.status === AppointmentStatus.ACCEPTED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         'bg-red-50 text-red-600 border-red-100'
                       }`}>
                         {t[app.status.toLowerCase() as keyof typeof t] || app.status}
                       </span>
                     </div>
                     
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8">
                       <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                         <i className="fas fa-calendar-check text-blue-500"></i>
                         {formatTimestamp(app.date)}
                       </div>
                     </div>
                   </div>

                   {app.status === AppointmentStatus.PENDING && (
                     <div className="flex gap-3">
                       <button 
                         onClick={() => handleUpdateAppointmentStatus(app.id, AppointmentStatus.ACCEPTED)}
                         className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                       >
                         {t.accept}
                       </button>
                       <button 
                         onClick={() => handleUpdateAppointmentStatus(app.id, AppointmentStatus.REJECTED)}
                         className="flex-1 py-4 bg-white text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-red-100 hover:bg-red-50 transition-all active:scale-95"
                       >
                         {t.reject}
                       </button>
                     </div>
                   )}
                 </div>
               ))
             ) : (
               <div className="col-span-full py-24 text-center">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-4xl mx-auto mb-6">
                   <i className="fas fa-calendar-xmark"></i>
                 </div>
                 <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">{t.noAppointments}</p>
               </div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 animate-in slide-in-from-bottom-6 duration-500">
           <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-emerald-600 text-white rounded-[32px] flex items-center justify-center text-4xl shadow-2xl shadow-emerald-200">
                   <i className="fas fa-user-md"></i>
                </div>
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{currentDoc.name}</h2>
                   <div className="flex items-center gap-3">
                     <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">{currentDoc.specialty}</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentDoc.experience} {lang === 'ru' ? 'опыта' : 'tajriba'}</span>
                   </div>
                </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-50 pt-10">
              <div className="space-y-6">
                 <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-3">{t.bio}</span>
                    <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-3xl border border-slate-100">{currentDoc.bio || (lang === 'ru' ? 'Информация отсутствует' : 'Ma\'lumot yo\'q')}</p>
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-3">{t.education}</span>
                    <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-3xl border border-slate-100">{currentDoc.education || (lang === 'ru' ? 'Информация отсутствует' : 'Ma\'lumot yo\'q')}</p>
                 </div>
              </div>
              <div className="space-y-6">
                 <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-3">{t.clinicName}</span>
                    <div className="flex items-center gap-4 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                       <i className="fas fa-hospital text-indigo-600 text-2xl"></i>
                       <div>
                          <p className="font-black text-slate-900 text-lg leading-tight mb-1">{currentDoc.clinicName}</p>
                          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                             <i className="fas fa-star"></i> {currentDoc.clinicRating} Network Rating
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      )}
    </div>
  );
};

export default DoctorDashboard;
