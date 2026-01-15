
import React, { useState } from 'react';
import { Language, ClinicDoctor, AvailabilityStatus } from '../types';
import { translations } from '../translations';

interface Props {
  lang: Language;
  doctors: ClinicDoctor[];
  setDoctors: (docs: ClinicDoctor[]) => void;
}

const ClinicDashboard: React.FC<Props> = ({ lang, doctors, setDoctors }) => {
  const t = translations[lang];
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialty: '', experience: '', location: '', clinicName: '', clinicRating: '5.0' });
  const [editingDoctor, setEditingDoctor] = useState<ClinicDoctor | null>(null);

  const avgRating = doctors.length > 0 ? (doctors.reduce((sum, d) => sum + d.rating, 0) / doctors.length).toFixed(1) : "0.0";

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] opacity-40"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 relative z-10">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{t.clinicStats}</h2>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Real-time Network Analytics</div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 px-6 py-4 rounded-[24px] text-emerald-700 border border-emerald-100/50 shadow-xl shadow-emerald-100/50">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-400 shadow-sm"><i className="fas fa-star"></i></div>
            <div className="flex flex-col">
              <span className="text-2xl font-black leading-none">{avgRating}</span>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Avg Network Rating</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
          {[
            { label: 'Network Reach', val: '1,420', icon: 'fa-users', col: 'text-blue-600', bg: 'bg-blue-50' },
            { label: t.doctor, val: doctors.length, icon: 'fa-user-doctor', col: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Activity Today', val: '42', icon: 'fa-bolt-lightning', col: 'text-amber-600', bg: 'bg-amber-50' }
          ].map((stat, i) => (
            <div key={i} className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-sm group hover:scale-[1.02] hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className={`w-12 h-12 ${stat.bg} ${stat.col} rounded-[18px] flex items-center justify-center text-xl mb-6 shadow-sm`}><i className={`fas ${stat.icon}`}></i></div>
              <div className="text-4xl font-black text-slate-900 mb-1">{stat.val}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-inner"><i className="fas fa-users-gear"></i></div>
            <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">{t.manageDoctors}</h3>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-[24px] text-sm font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
            <i className={`fas ${showAddForm ? 'fa-times' : 'fa-plus'}`}></i>
            {showAddForm ? t.cancel : t.addDoctor}
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-6 text-left">Identity</th>
                <th className="px-10 py-6 text-left">{t.specialty}</th>
                <th className="px-10 py-6 text-center">{t.status}</th>
                <th className="px-10 py-6 text-center">{t.rating}</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {doctors.length > 0 ? doctors.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-all group duration-300">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm"><i className="fas fa-user-doctor"></i></div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-base leading-tight mb-1">{doc.name}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.location}</span>
                        {doc.clinicName && <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">{doc.clinicName}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-sm font-bold text-slate-600">{doc.specialty}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{doc.experience}</div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-sm border ${
                      doc.status === AvailabilityStatus.AVAILABLE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      doc.status === AvailabilityStatus.BUSY ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="inline-flex flex-col items-center">
                      <div className="inline-flex items-center gap-2 text-amber-500 font-black text-lg">
                         <i className="fas fa-star text-xs"></i> {doc.rating.toFixed(1)}
                      </div>
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{doc.reviewsCount} {t.reviews}</div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <button onClick={() => setEditingDoctor(doc)} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 border border-slate-100 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm" title={t.edit}><i className="fas fa-edit text-xs"></i></button>
                      <button onClick={() => { if(confirm(t.logout)) setDoctors(doctors.filter(d => d.id !== doc.id)); }} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 border border-slate-100 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm" title={t.remove}><i className="fas fa-trash-alt text-xs"></i></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-10 py-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-3xl mx-auto mb-6"><i className="fas fa-user-slash"></i></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">No clinical staff records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ClinicDashboard;
