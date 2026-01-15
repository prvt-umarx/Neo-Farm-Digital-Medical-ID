
import React, { useState, useEffect } from 'react';
import { Role, Language, UserProfile, Diagnosis, Prescription, ClinicDoctor, AvailabilityStatus, Appointment, Review } from './types';
import { translations } from './translations';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import ClinicDashboard from './components/ClinicDashboard';
import Onboarding from './components/Onboarding';
import Registration from './components/Registration';

const INITIAL_CLINIC_DOCTORS: ClinicDoctor[] = [
  { 
    id: "cd1", 
    name: "Д-р Смирнова", 
    specialty: "Кардиолог", 
    rating: 4.8, 
    reviewsCount: 340, 
    experience: "12 лет", 
    location: "Ташкент", 
    languages: ["RU", "UZ"], 
    status: AvailabilityStatus.AVAILABLE, 
    clinicName: "Центральная Клиника Neo", 
    clinicRating: 4.9,
    bio: "Специалист широкого профиля с акцентом на кардиологию и терапию. Постоянный участник международных форумов.",
    education: "Ташкентский Медицинский Институт, 2010"
  },
  { 
    id: "cd2", 
    name: "Д-р Ахмедов", 
    specialty: "Терапевт", 
    rating: 5.0, 
    reviewsCount: 210, 
    experience: "8 лет", 
    location: "Самарканд", 
    languages: ["RU", "UZ", "EN"], 
    status: AvailabilityStatus.BUSY, 
    clinicName: "Samarkand Health Center", 
    clinicRating: 4.7,
    bio: "Врач первой категории. Специализируется на лечении сезонных заболеваний и общей диагностике.",
    education: "Самаркандский Государственный Медицинский Университет, 2014"
  },
];

const App: React.FC = () => {
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    return localStorage.getItem('neo_farm_registered') === 'true';
  });

  const [role, setRole] = useState<Role | null>(() => {
    const saved = localStorage.getItem('neo_farm_role');
    return (saved as Role) || null;
  });

  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => {
    return localStorage.getItem('neo_farm_onboarding_done') === 'true';
  });

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('neo_farm_lang');
    return (saved as Language) || Language.RU;
  });

  const [patientData, setPatientData] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('neo_farm_data');
    return saved ? JSON.parse(saved) : null;
  });

  const [clinicDoctors, setClinicDoctors] = useState<ClinicDoctor[]>(() => {
    const saved = localStorage.getItem('neo_farm_clinic_doctors');
    return saved ? JSON.parse(saved) : INITIAL_CLINIC_DOCTORS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('neo_farm_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('neo_farm_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('neo_farm_registered', isRegistered.toString());
  }, [isRegistered]);

  useEffect(() => {
    if (role) localStorage.setItem('neo_farm_role', role);
    else localStorage.removeItem('neo_farm_role');
  }, [role]);

  useEffect(() => {
    localStorage.setItem('neo_farm_onboarding_done', onboardingDone.toString());
  }, [onboardingDone]);

  useEffect(() => {
    localStorage.setItem('neo_farm_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (patientData) localStorage.setItem('neo_farm_data', JSON.stringify(patientData));
  }, [patientData]);

  useEffect(() => {
    localStorage.setItem('neo_farm_clinic_doctors', JSON.stringify(clinicDoctors));
  }, [clinicDoctors]);

  useEffect(() => {
    localStorage.setItem('neo_farm_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('neo_farm_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const handleRegistrationComplete = (user: UserProfile, selectedRole: Role) => {
    setPatientData(user);
    setRole(selectedRole);
    setIsRegistered(true);
  };

  const handleLogout = () => {
    setRole(null);
    setIsRegistered(false);
    setOnboardingDone(false);
    localStorage.removeItem('neo_farm_role');
    localStorage.removeItem('neo_farm_registered');
    localStorage.removeItem('neo_farm_onboarding_done');
    localStorage.removeItem('neo_farm_data');
  };

  const addReview = (review: Omit<Review, 'id' | 'date' | 'patientId' | 'patientName'>) => {
    if (!patientData) return;
    const newReview: Review = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      patientId: patientData.id,
      patientName: `${patientData.name} ${patientData.surname}`
    };

    const newReviews = [...reviews, newReview];
    setReviews(newReviews);

    const doctorReviews = newReviews.filter(r => r.doctorId === review.doctorId);
    const avgRating = doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length;
    
    setClinicDoctors(clinicDoctors.map(doc => 
      doc.id === review.doctorId 
        ? { ...doc, rating: avgRating, reviewsCount: doctorReviews.length }
        : doc
    ));
  };

  if (!isRegistered || !role || !patientData) {
    return (
      <Registration 
        lang={lang} 
        onComplete={handleRegistrationComplete} 
        onLanguageChange={setLang}
      />
    );
  }

  if (!onboardingDone) {
    return <Onboarding role={role} lang={lang} onComplete={() => setOnboardingDone(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-700">
      <header className="sticky top-0 z-[100] glass px-6 py-4 flex items-center justify-between shadow-sm border-b border-slate-200/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
             <i className="fas fa-hand-holding-medical text-xl"></i>
          </div>
          <span className="font-extrabold text-slate-900 text-xl tracking-tight hidden sm:block">{t.appName}</span>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 p-1.5 rounded-2xl border border-slate-200/50">
          <button 
            onClick={() => setLang(lang === Language.RU ? Language.UZ : Language.RU)}
            className="text-xs font-bold text-slate-600 px-3 py-1.5 rounded-xl hover:bg-white transition-all"
          >
            {lang === Language.RU ? 'O\'zbek' : 'Русский'}
          </button>
          <div className="h-6 w-px bg-slate-200/60"></div>
          <button 
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title={t.logout}
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
        {role === Role.PATIENT && (
          <PatientDashboard 
            data={patientData} 
            lang={lang} 
            onUpdate={setPatientData}
            clinicDoctors={clinicDoctors}
            appointments={appointments}
            setAppointments={setAppointments}
            onLeaveReview={addReview}
          />
        )}
        {role === Role.DOCTOR && (
          <DoctorDashboard 
            patientData={patientData} 
            updatePatientData={setPatientData} 
            lang={lang} 
            clinicDoctors={clinicDoctors}
            setClinicDoctors={setClinicDoctors}
            appointments={appointments}
            setAppointments={setAppointments}
          />
        )}
        {role === Role.PHARMACY && (
          <PharmacyDashboard 
            patientData={patientData} 
            updatePatientData={setPatientData} 
            lang={lang} 
          />
        )}
        {role === Role.CLINIC && (
          <ClinicDashboard 
            lang={lang} 
            doctors={clinicDoctors}
            setDoctors={setClinicDoctors}
          />
        )}
      </main>

      {/* Modern Status Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 glass rounded-full shadow-2xl border border-white/50 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          role === Role.PATIENT ? 'bg-blue-500' :
          role === Role.DOCTOR ? 'bg-emerald-500' :
          role === Role.PHARMACY ? 'bg-amber-500' : 'bg-indigo-500'
        }`}></div>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
          {role} Session Active
        </span>
      </div>
    </div>
  );
};

export default App;
