
import React, { useState } from 'react';
import { UserProfile, Role, Language } from '../types';
import { translations } from '../translations';
import QRScanner from './QRScanner';

interface Props {
  patientData: UserProfile;
  updatePatientData: (data: UserProfile) => void;
  lang: Language;
}

const PharmacyDashboard: React.FC<Props> = ({ patientData, updatePatientData, lang }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPatientId, setScannedPatientId] = useState<string | null>(null);
  const t = translations[lang];

  const handleScanSuccess = (decodedId: string) => {
    setIsScanning(false);
    setScannedPatientId(decodedId);
    const newLog = { id: Math.random().toString(36).substr(2, 9), accessorName: "Pharmacy 'Neo Pharm Central'", role: Role.PHARMACY, timestamp: new Date().toISOString() };
    updatePatientData({ ...patientData, accessLog: [newLog, ...patientData.accessLog] });
  };

  const handleMarkAsFilled = (id: string) => {
    const updated = patientData.prescriptions.map(p => p.id === id ? { ...p, isFilled: true } : p);
    updatePatientData({ ...patientData, prescriptions: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {isScanning && <QRScanner lang={lang} onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}

      {!scannedPatientId && !isScanning && (
        <div className="text-center py-24 flex flex-col items-center animate-in zoom-in-95 duration-700">
          <div className="w-32 h-32 bg-amber-100 text-amber-600 rounded-[40px] flex items-center justify-center text-5xl mb-10 shadow-2xl shadow-amber-100 border-4 border-white">
            <i className="fas fa-prescription-bottle-medical"></i>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">{lang === 'ru' ? 'Выдача лекарств' : 'Dori berish'}</h2>
          <p className="text-slate-500 mb-12 max-w-md font-medium text-lg leading-relaxed opacity-80">{lang === 'ru' ? 'Отсканируйте код пациента для автоматической проверки рецептов и критических аллергий' : 'Retseptlarni va allergiyalarni tekshirish uchun bemor kodini skanerlang'}</p>
          <button onClick={() => setIsScanning(true)} className="px-12 py-6 bg-amber-500 text-white rounded-[32px] shadow-2xl shadow-amber-200 hover:bg-amber-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 text-xl font-black tracking-tight">
            <i className="fas fa-qrcode text-3xl"></i>
            {t.scanQR}
          </button>
        </div>
      )}

      {scannedPatientId && !isScanning && (
        <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
           {/* Privacy Protection Banner - Modern Glassmorphism */}
           <div className="glass p-6 rounded-[32px] flex items-center gap-6 shadow-2xl border-amber-500/20">
             <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                <i className="fas fa-user-shield text-2xl"></i>
             </div>
             <div className="flex-1">
                <p className="font-black text-slate-900 text-sm uppercase tracking-widest">{t.accessDenied}</p>
                <p className="text-slate-500 text-xs font-bold leading-relaxed">{t.medicalHistorySecret}</p>
             </div>
             <button onClick={() => setScannedPatientId(null)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-times text-xl"></i></button>
           </div>

           {/* Patient Quick Info Header */}
           <div className="bg-white rounded-[32px] p-8 border border-slate-100 flex items-center gap-6 shadow-xl">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-2xl border border-slate-100">
                <i className="fas fa-user"></i>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">{patientData.name} {patientData.surname}</h2>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">PATIENT IDENTITY VERIFIED</div>
              </div>
           </div>

           {/* CRITICAL ALLERGIES - High Visual Priority */}
           <section className="bg-red-600 p-10 rounded-[48px] shadow-2xl shadow-red-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-x-[-40%] -translate-y-[-40%] blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/30 animate-pulse"><i className="fas fa-triangle-exclamation text-xl"></i></div>
                <h3 className="text-white font-black text-sm uppercase tracking-[0.3em]">{t.allergies} — ATTENTION</h3>
              </div>
              <div className="flex flex-wrap gap-4 relative z-10">
                {patientData.allergies.length > 0 ? (
                  patientData.allergies.map((a, i) => (
                    <span key={i} className="px-8 py-4 bg-white text-red-600 rounded-[24px] text-lg font-black shadow-2xl flex items-center gap-3 animate-in zoom-in-95 duration-300 border border-white/50">
                      <i className="fas fa-ban"></i> {a}
                    </span>
                  ))
                ) : (
                  <span className="text-white/80 font-black tracking-widest uppercase text-xs italic">No known allergies reported</span>
                )}
              </div>
           </section>

           {/* Active Prescriptions List */}
           <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
             <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-inner"><i className="fas fa-file-medical"></i></div>
                 <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">{t.activePrescriptions}</h3>
               </div>
               <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-[10px] font-black tracking-widest shadow-sm">
                 {patientData.prescriptions.filter(p => !p.isFilled).length} REMAINING
               </div>
             </div>
             
             <div className="divide-y divide-slate-100">
               {patientData.prescriptions.length > 0 ? (
                 [...patientData.prescriptions].sort((a,b) => Number(a.isFilled) - Number(b.isFilled)).map(p => (
                   <div key={p.id} className={`p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8 transition-all duration-300 ${p.isFilled ? 'bg-slate-50/30 opacity-40' : 'hover:bg-slate-50/50'}`}>
                     <div className="space-y-4">
                       <h4 className="font-black text-slate-900 text-2xl tracking-tight uppercase leading-none">{p.medication}</h4>
                       <div className="flex flex-wrap items-center gap-3">
                         <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm">
                           {p.dosage}
                         </span>
                         <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm">
                           {p.duration}
                         </span>
                       </div>
                       
                       {p.linkedDiagnosisId && (
                         <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-indigo-100/50">
                           <i className="fas fa-tag"></i>
                           {patientData.diagnoses.find(d => d.id === p.linkedDiagnosisId)?.condition || 'Diagnosis'}
                         </div>
                       )}

                       <div className="text-[9px] text-slate-400 font-bold flex items-center gap-3 uppercase tracking-[0.2em] pt-2">
                         <span className="flex items-center gap-1.5"><i className="fas fa-user-md opacity-40"></i> {p.doctorName}</span>
                         <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                         <span className="flex items-center gap-1.5"><i className="fas fa-calendar-day opacity-40"></i> {new Date(p.date).toLocaleDateString()}</span>
                       </div>
                     </div>
                     
                     <div>
                        {!p.isFilled ? (
                          <button onClick={() => handleMarkAsFilled(p.id)} className="w-full sm:w-auto px-10 py-5 bg-amber-500 text-white rounded-[28px] text-base font-black shadow-2xl shadow-amber-200 hover:bg-amber-600 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3">
                            <i className="fas fa-check-circle"></i>{t.fillPrescription}
                          </button>
                        ) : (
                          <div className="w-full sm:w-auto px-10 py-5 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 rounded-[28px] text-base font-black flex items-center justify-center gap-3 opacity-100 shadow-inner">
                            <i className="fas fa-circle-check"></i>{t.filled}
                          </div>
                        )}
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="py-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-4xl mx-auto mb-6"><i className="fas fa-folder-open"></i></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">{t.noPrescriptions}</p>
                 </div>
               )}
             </div>
           </section>

           <div className="pt-10 flex justify-center pb-20">
              <button onClick={() => setScannedPatientId(null)} className="px-10 py-5 bg-white text-slate-800 font-black rounded-3xl border-2 border-slate-100 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-300 flex items-center gap-3 shadow-xl">
                <i className="fas fa-door-open"></i> {lang === 'ru' ? 'Завершить сессию' : 'Seansni yakunlash'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;
