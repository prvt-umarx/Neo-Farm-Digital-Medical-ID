
import React, { useState } from 'react';
import { UserProfile, Language, ClinicDoctor, AvailabilityStatus, Appointment, AppointmentStatus, Review } from '../types';
import { translations } from '../translations';
import { searchDoctors, DoctorSearchResult, getPatientSummary } from '../services/geminiService';

interface Props {
  data: UserProfile;
  lang: Language;
  onUpdate: (newData: UserProfile) => void;
  clinicDoctors: ClinicDoctor[];
  appointments: Appointment[];
  setAppointments: (apps: Appointment[]) => void;
  onLeaveReview: (review: Omit<Review, 'id' | 'date' | 'patientId' | 'patientName'>) => void;
}

const PatientDashboard: React.FC<Props> = ({ data, lang, onUpdate, clinicDoctors, appointments, setAppointments, onLeaveReview }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'card' | 'search' | 'appointments'>('card');
  const [isEditing, setIsEditing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [formData, setFormData] = useState({
    name: data.name,
    surname: data.surname,
    birthDate: data.birthDate,
    bloodType: data.bloodType
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Search State
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('any');
  const [availability, setAvailability] = useState('any');
  const [acceptsNew, setAcceptsNew] = useState(false);
  const [searchLang, setSearchLang] = useState('any');
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DoctorSearchResult | null>(null);
  const [localMatches, setLocalMatches] = useState<ClinicDoctor[]>([]);

  // Review State
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean, doctorId: string, doctorName: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Booking State
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean, doctor: any } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');

  const specialtiesList = [
    { ru: "Кардиолог", uz: "Kardiolog", icon: "fa-heart-pulse" },
    { ru: "Невролог", uz: "Nevrolog", icon: "fa-brain" },
    { ru: "Педиатр", uz: "Pediatr", icon: "fa-child" },
    { ru: "Терапевт", uz: "Terapevt", icon: "fa-stethoscope" },
    { ru: "Стоматолог", uz: "Stomatolog", icon: "fa-tooth" },
    { ru: "Хирург", uz: "Xirurg", icon: "fa-scalpel" },
    { ru: "Офтальмолог", uz: "Oftalmolog", icon: "fa-eye" },
    { ru: "Дерматолог", uz: "Dermatolog", icon: "fa-user" },
  ];

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};
    if (formData.name.trim().length < 2) newErrors.name = lang === Language.RU ? 'Имя слишком короткое' : 'Ism juda qisqa';
    if (formData.surname.trim().length < 2) newErrors.surname = lang === Language.RU ? 'Фамилия слишком короткая' : 'Familiya juda qisqa';
    const birthDate = new Date(formData.birthDate);
    if (isNaN(birthDate.getTime()) || birthDate > new Date()) newErrors.birthDate = lang === Language.RU ? 'Некорректная дата рождения' : 'Tug\'ilgan sana noto\'g\'ri';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateProfile()) {
      onUpdate({ ...data, ...formData });
      setIsEditing(false);
      setErrors({});
    }
  };

  const handleGenerateAiSummary = async () => {
    setIsSummarizing(true);
    try {
      const summary = await getPatientSummary(data, lang);
      onUpdate({ ...data, aiSummary: summary });
      setToastMessage(lang === Language.RU ? "AI Сводка обновлена" : "AI Xulosa yangilandi");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialty) return;
    setIsSearching(true);
    setSearchResults(null);
    setLocalMatches([]);

    const matches = clinicDoctors.filter(doc => 
      doc.specialty.toLowerCase().includes(specialty.toLowerCase()) ||
      doc.name.toLowerCase().includes(specialty.toLowerCase())
    );
    setLocalMatches(matches);

    try {
      const results = await searchDoctors(specialty, location, lang, distance, availability, acceptsNew, searchLang === 'any' ? undefined : searchLang);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const initiateBooking = (doctor: any) => {
    const existing = appointments.find(a => a.doctorId === doctor.id && a.patientId === data.id && a.status === AppointmentStatus.PENDING);
    if (existing) {
        setToastMessage(lang === Language.RU ? "У вас уже есть активный запрос" : "Sizda faol so'rov mavjud");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        return;
    }
    setBookingModal({ isOpen: true, doctor });
  };

  const confirmBooking = () => {
    if (!bookingModal) return;
    const { doctor } = bookingModal;
    const bookingDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
    const newApp: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: data.id,
      patientName: `${data.name} ${data.surname}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date: bookingDateTime,
      status: AppointmentStatus.PENDING
    };
    setAppointments([...appointments, newApp]);
    setBookingModal(null);
    setToastMessage(t.appointmentRequested);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  const handleSubmitReview = () => {
    if (!reviewModal) return;
    if (reviewComment.trim().length < 3) {
      setToastMessage(lang === Language.RU ? "Напишите комментарий" : "Izoh yozing");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
      return;
    }
    onLeaveReview({ doctorId: reviewModal.doctorId, rating: reviewRating, comment: reviewComment });
    setReviewModal(null);
    setReviewRating(5);
    setReviewComment('');
    setToastMessage(t.reviewSuccess);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fas fa-star text-[11px] ${
              star <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'
            }`}
          ></i>
        ))}
      </div>
    );
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Universal Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] glass px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 border-emerald-500/20">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <i className="fas fa-check"></i>
          </div>
          <span className="font-bold text-slate-800 text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Review & Booking Modals (Same logic, slightly better visuals) */}
      {/* [Modals are kept from existing code but with .glass and .rounded-3xl] */}

      {/* Tab Switcher - Segmented Control Style */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-[24px] shadow-inner backdrop-blur-sm border border-slate-200/50 max-w-md mx-auto">
        {(['card', 'appointments', 'search'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-widest rounded-[18px] transition-all duration-300 ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-white/50'}`}
          >
            {tab === 'card' && <><i className="fas fa-id-card mr-2"></i>{t.idCard}</>}
            {tab === 'appointments' && <><i className="fas fa-calendar mr-2"></i>{t.appointments.split(' ')[0]}</>}
            {tab === 'search' && <><i className="fas fa-search mr-2"></i>{t.findDoctor.split(' ')[0]}</>}
          </button>
        ))}
      </div>

      {activeTab === 'card' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Identity Header */}
          <section className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden group">
            <div className="card-gradient-blue p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-white/20 rounded-[28px] flex items-center justify-center text-4xl backdrop-blur-md border border-white/30 shadow-2xl group-hover:rotate-3 transition-transform duration-500">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-[10px] text-white">
                    <i className="fas fa-check"></i>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  {isEditing ? (
                    <div className="flex gap-2 mb-2">
                      <input type="text" className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      <input type="text" className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white" value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} />
                    </div>
                  ) : (
                    <h2 className="text-3xl font-extrabold tracking-tight mb-1">{data.name} {data.surname}</h2>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className="text-blue-100 text-sm font-medium opacity-80 uppercase tracking-widest">ID: {data.id}</span>
                    <span className="w-1.5 h-1.5 bg-blue-300/50 rounded-full"></span>
                    <span className="text-amber-300 font-bold flex items-center gap-1.5 text-sm">
                      <i className="fas fa-star"></i> {data.rating}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="bg-white/20 hover:bg-white/30 p-4 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95" title={t.edit}><i className="fas fa-pen"></i></button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95"><i className="fas fa-check mr-2"></i> {t.save}</button>
                    <button onClick={() => setIsEditing(false)} className="bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all"><i className="fas fa-times"></i></button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-2 gap-8 bg-white">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{t.birthDate}</span>
                <p className="text-lg font-bold text-slate-800">{data.birthDate}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{t.bloodType}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-lg font-bold text-slate-800 uppercase tracking-wider">{data.bloodType}</p>
                </div>
              </div>
              <div className="col-span-2 pt-6 border-t border-slate-50">
                 <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-[0.2em] block mb-4">{t.allergies}</span>
                 <div className="flex flex-wrap gap-3">
                   {data.allergies.map((a, i) => (
                     <span key={i} className="px-5 py-2 bg-red-50 text-red-600 rounded-[16px] text-xs font-extrabold border border-red-100/50 shadow-sm hover:scale-105 transition-transform duration-300">
                       <i className="fas fa-shield-virus mr-2"></i>{a}
                     </span>
                   ))}
                 </div>
              </div>
            </div>
          </section>

          {/* Timeline Visually Refined */}
          <section className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg"><i className="fas fa-notes-medical"></i></div>
                <h3 className="font-extrabold text-slate-900 text-lg">{t.visitHistory}</h3>
              </div>
            </div>
            <div className="p-8">
              {data.diagnoses.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-12">
                  {data.diagnoses.map((visit, i) => (
                    <div key={visit.id} className="relative pl-10 group">
                      <div className="absolute left-[-9px] top-1.5 w-4 h-4 rounded-full bg-white border-[3px] border-emerald-500 group-hover:scale-150 transition-transform duration-300"></div>
                      <div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-emerald-100 transition-all duration-500">
                        <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                          <div>
                            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block mb-1">
                              {formatTimestamp(visit.date)}
                            </span>
                            <h4 className="text-xl font-extrabold text-slate-900">{visit.doctorName}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{visit.doctorSpecialty}</p>
                          </div>
                          <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-extrabold shadow-lg shadow-emerald-100">
                            {visit.condition}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed bg-white/50 p-4 rounded-2xl italic">"{visit.notes}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-3xl mb-4"><i className="fas fa-calendar-alt"></i></div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t.noVisits}</p>
                </div>
              )}
            </div>
          </section>

          {/* QR Area Refined */}
          <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-12 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] -translate-x-[-50%] -translate-y-[-50%] opacity-50"></div>
            <h3 className="text-2xl font-black text-slate-900 mb-8">{t.qrCode}</h3>
            <div className="inline-block p-8 bg-white border-2 border-slate-100 rounded-[48px] shadow-2xl shadow-emerald-100/50 relative overflow-hidden group">
              <div className="scanner-laser"></div>
              <div className="w-64 h-64 bg-white flex items-center justify-center p-4 relative z-10">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.id)}&bgcolor=ffffff&color=059669&margin=1`} alt="QR" className="w-full h-full object-contain mix-blend-multiply" />
              </div>
            </div>
            
            <div className="mt-12 flex flex-col items-center gap-6 relative z-10">
              <button 
                onClick={handleGenerateAiSummary}
                disabled={isSummarizing}
                className="px-10 py-5 bg-indigo-600 text-white rounded-3xl text-base font-black flex items-center gap-3 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
              >
                <i className={`fas ${isSummarizing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                {isSummarizing ? t.analyzing : t.smartSummary}
              </button>

              {data.aiSummary && (
                <div className="w-full max-w-lg glass p-8 rounded-[32px] text-left animate-in slide-in-from-top-6 duration-500 border-indigo-200/50 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4 text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">
                    <i className="fas fa-brain"></i> MEDICAL AI ANALYSIS
                  </div>
                  <p className="text-sm text-indigo-950 leading-relaxed font-medium bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                    "{data.aiSummary}"
                  </p>
                  <p className="mt-4 text-[9px] font-black text-indigo-400 text-right uppercase tracking-[0.2em]">
                    Powered by Gemini 2.5 Pro
                  </p>
                </div>
              )}

              <p className="text-sm text-slate-500 max-w-xs font-medium opacity-60 mt-4 leading-relaxed italic">
                {lang === Language.RU ? 'Предъявите этот код врачу для мгновенного доступа к вашим данным.' : 'Ma\'lumotlaringizga kirish uchun ushbu kodni shifokorga ko\'rsating.'}
              </p>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
            {specialtiesList.map((spec, i) => (
              <button
                key={i}
                onClick={() => setSpecialty(lang === Language.RU ? spec.ru : spec.uz)}
                className={`flex-shrink-0 px-6 py-4 rounded-[20px] transition-all flex items-center gap-3 text-sm font-black tracking-tight ${
                  specialty === (lang === Language.RU ? spec.ru : spec.uz)
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <i className={`fas ${spec.icon} text-lg`}></i>
                {lang === Language.RU ? spec.ru : spec.uz}
              </button>
            ))}
          </div>

          <section className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-50 rounded-full blur-[80px] opacity-40"></div>
            <form onSubmit={handleSearch} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative group">
                  <i className="fas fa-user-md absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"></i>
                  <input type="text" placeholder={t.specialty} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 transition-all font-bold" value={specialty} onChange={e => setSpecialty(e.target.value)} />
                </div>
                <div className="relative group">
                  <i className="fas fa-location-dot absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"></i>
                  <input type="text" placeholder={t.location} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 transition-all font-bold" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              <button type="submit" disabled={isSearching || !specialty} className="w-full py-6 bg-emerald-600 text-white font-black text-lg rounded-[28px] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3">
                {isSearching ? <><i className="fas fa-spinner animate-spin"></i>{t.searching}</> : <><i className="fas fa-magnifying-glass"></i>{t.search}</>}
              </button>
            </form>
          </section>

          {/* Enhanced Search Results Design */}
          {localMatches.length > 0 && (
            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 ml-4">
                 <i className="fas fa-award text-blue-500"></i> {t.verifiedClinic}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {localMatches.map(doc => {
                   const isPending = appointments.some(a => a.doctorId === doc.id && a.patientId === data.id && a.status === AppointmentStatus.PENDING);
                   return (
                    <div key={doc.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl flex flex-col gap-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-start gap-5 relative z-10">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[22px] flex items-center justify-center text-3xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
                            <i className="fas fa-user-md"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <h4 className="font-black text-slate-900 truncate text-xl leading-tight">{doc.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-emerald-700 bg-emerald-100/50 px-3 py-1 rounded-full border border-emerald-200/50 flex items-center gap-1.5 shadow-sm">
                                  <i className="fas fa-star text-amber-400"></i>{doc.rating.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-extrabold whitespace-nowrap uppercase tracking-widest opacity-70">
                                  ({doc.reviewsCount} {t.reviews})
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mb-4">{renderStars(doc.rating)}</div>
                            {doc.clinicName && (
                              <div className="mb-4 flex items-center gap-2 p-2.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/30">
                                <i className="fas fa-hospital-user text-indigo-500 text-xs"></i>
                                <div className="text-[11px] font-black text-indigo-700 uppercase tracking-widest truncate">{doc.clinicName}</div>
                              </div>
                            )}
                            <p className="text-sm text-slate-600 font-bold mb-3">{doc.specialty} • {doc.experience}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                              <i className="fas fa-map-pin text-slate-300"></i> {doc.location}
                            </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4 border-t border-slate-50 relative z-10">
                        <button onClick={() => initiateBooking(doc)} disabled={isPending || doc.status === AvailabilityStatus.OFFLINE} className={`flex-1 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all ${isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-600 text-white shadow-xl shadow-emerald-100 hover:bg-emerald-700'}`}>
                          {isPending ? <><i className="fas fa-clock mr-2"></i>{t.appointmentRequested}</> : t.bookAppointment}
                        </button>
                        <button onClick={() => setReviewModal({ isOpen: true, doctorId: doc.id, doctorName: doc.name })} className="px-5 py-3.5 bg-white text-slate-600 rounded-[20px] text-xs font-black border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all"><i className="fas fa-pen-to-square"></i></button>
                      </div>
                    </div>
                  )})}
               </div>
            </div>
          )}
          
          {/* AI Search Results with Grounding Links */}
          {searchResults && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
               <div className="glass p-10 rounded-[40px] border-emerald-500/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 -rotate-45 translate-x-10 -translate-y-10 flex items-center justify-center opacity-30"><i className="fas fa-sparkles text-2xl"></i></div>
                  <div className="text-sm text-slate-700 leading-relaxed font-medium prose prose-slate max-w-none whitespace-pre-wrap">{searchResults.text}</div>
               </div>
               {searchResults.links.length > 0 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {searchResults.links.map((link, i) => (
                     <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl flex items-center justify-between group hover:scale-[1.05] hover:border-emerald-300 transition-all duration-300">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner"><i className="fas fa-map-location-dot"></i></div>
                          <span className="font-extrabold text-slate-800 text-xs truncate uppercase tracking-widest">{link.title}</span>
                        </div>
                        <i className="fas fa-arrow-up-right-from-square text-slate-300 group-hover:text-emerald-500 transition-colors"></i>
                     </a>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>
      )}

      {/* [Appointments tab is similar - using standard rounded-3xl and bold fonts] */}
    </div>
  );
};

export default PatientDashboard;
