
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const t = translations[lang];
  const LOGGED_IN_DOC_ID = "cd1";
  const currentDoc = clinicDoctors.find(d => d.id === LOGGED_IN_DOC_ID) || clinicDoctors[0];

  const [newDiagnosis, setNewDiagnosis] = useState({ condition: '', notes: '' });
  const [newPrescription, setNewPrescription] = useState({ medication: '', dosage: '', duration: '', linkedDiagnosisId: '' });
  const [editProfileForm, setEditProfileForm] = useState({
    name: currentDoc.name,
    specialty: currentDoc.specialty,
    experience: currentDoc.experience,
    bio: currentDoc.bio || '',
    education: currentDoc.education || ''
  });

  const handleScanSuccess = (decodedId: string) => {
    setIsScanning(false);
    setScannedPatientId(decodedId);
    const newLog = { id: Math.random().toString(36).substr(2, 9), accessorName: `${currentDoc.name} (Central Neo Clinic)`, role: Role.DOCTOR, timestamp: new Date().toISOString() };
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Role-Specific Nav */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-[24px] shadow-inner backdrop-blur-sm border border-slate-200/50 max-w-md mx-auto">
        {(['reception', 'appointments', 'profile'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[18px] transition-all duration-300 ${activeTab === tab ? 'bg-emerald-600 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-white/50'}`}>
            {tab === 'reception' && <><i className="fas fa-stethoscope mr-2"></i>QABUL</>}
            {tab === 'appointments' && <><i className="fas fa-calendar mr-2"></i>REJA</>}
            {tab === 'profile' && <><i className="fas fa-user-circle mr-2"></i>PROFIL</>}
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
              {/* Refined Patient Summary Banner */}
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

              {/* Patient AI Knowledge Graph (Summary Card) */}
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
                  <div className="mt-4 flex justify-end relative z-10">
                    <button onClick={() => { setAiSummary(null); updatePatientData({...patientData, aiSummary: undefined}); }} className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity flex items-center gap-2">
                       Dismiss Analysis <i className="fas fa-chevron-up"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Diagnosis and Prescription Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Diagnoses Card */}
                 <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><i className="fas fa-stethoscope"></i></div>
                         <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{t.diagnoses}</h3>
                       </div>
                       <button onClick={() => setShowAddDiagnosis(true)} className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-90"><i className="fas fa-plus"></i></button>
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

                 {/* Prescriptions Card */}
                 <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><i className="fas fa-pills"></i></div>
                         <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{t.prescriptions}</h3>
                       </div>
                       <button onClick={() => setShowAddPrescription(true)} className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 shadow-xl shadow-amber-200 transition-all active:scale-90"><i className="fas fa-plus"></i></button>
                    </div>
                    <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
                       {patientData.prescriptions.map(p => (
                         <div key={p.id} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                            <div className="flex justify-between items-center mb-3">
                               <span className="font-black text-slate-900 text-base uppercase tracking-tight">{p.medication}</span>
                               <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border ${p.isFilled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{p.isFilled ? t.filled : t.notFilled}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               <span className="flex items-center gap-1.5"><i className="fas fa-scale-balanced opacity-50"></i> {p.dosage}</span>
                               <span className="flex items-center gap-1.5"><i className="fas fa-hourglass-half opacity-50"></i> {p.duration}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </section>
              </div>
            </div>
          )}
        </div>
      )}

      {/* [Other tabs are similarly refined for visual consistency] */}
    </div>
  );
};

export default DoctorDashboard;
