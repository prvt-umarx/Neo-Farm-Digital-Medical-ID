
import React, { useState, useEffect } from 'react';
import { Language, Role, RegistrationStep, UserProfile } from '../types';
import { translations } from '../translations';

interface Props {
  lang: Language;
  onComplete: (user: UserProfile, role: Role) => void;
  onLanguageChange: (lang: Language) => void;
}

const Registration: React.FC<Props> = ({ lang, onComplete, onLanguageChange }) => {
  const t = translations[lang];
  const [step, setStep] = useState<RegistrationStep>(RegistrationStep.PHONE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    birthDate: '',
    bloodType: 'A+'
  });
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // Mock SMS States
  const [showMockSms, setShowMockSms] = useState(false);
  const [mockCode, setMockCode] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 7) {
      // Simulate sending SMS
      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      setMockCode(generatedCode);
      setShowToast(true);
      
      setTimeout(() => {
        setStep(RegistrationStep.OTP);
        setShowMockSms(true);
      }, 800);

      // Hide mock SMS notification after 8 seconds
      setTimeout(() => setShowMockSms(false), 8000);
      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For the MVP, we allow the generated mock code
    if (otp === mockCode || otp === '1234') {
      setShowMockSms(false);
      setStep(RegistrationStep.INFO);
    } else {
      alert(lang === Language.RU ? 'Неверный код. Попробуйте 1234 или код из уведомления.' : 'Kod noto\'g\'ri. 1234 yoki bildirishnomadagi kodni sinab ko\'ring.');
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.surname && formData.birthDate) {
      setStep(RegistrationStep.ROLE);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    const newUser: UserProfile = {
      id: "USER-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      phone,
      name: formData.name,
      surname: formData.surname,
      birthDate: formData.birthDate,
      bloodType: formData.bloodType,
      allergies: [],
      diagnoses: [],
      prescriptions: [],
      rating: 5.0,
      reviewsCount: 0,
      accessLog: []
    };
    onComplete(newUser, role);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Mock SMS Notification Banner */}
      {showMockSms && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] w-full max-w-sm px-4 animate-in slide-in-from-top-full duration-500">
          <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <i className="fas fa-comment-sms"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Messages • Just now</p>
              <p className="text-sm font-bold truncate">Neo Farm Code: <span className="text-emerald-400 text-lg tracking-widest">{mockCode}</span></p>
            </div>
            <button onClick={() => setShowMockSms(false)} className="text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Internal Success Toast */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[140] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm animate-in fade-in slide-in-from-bottom-4">
          <i className="fas fa-paper-plane mr-2"></i>
          {lang === Language.RU ? `SMS отправлено на ${phone}` : `SMS ${phone} raqamiga yuborildi`}
        </div>
      )}

      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="w-full max-w-xl bg-white/70 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 duration-700 relative z-10">
        <div className="bg-emerald-600 px-8 py-10 text-center text-white">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">{t.appName}</h1>
          <p className="text-emerald-100 font-medium opacity-90 text-sm uppercase tracking-widest">{t.registration.title}</p>
        </div>

        <div className="p-8">
          {/* Language Selector */}
          <div className="flex justify-center gap-3 mb-8">
            <button 
              onClick={() => onLanguageChange(Language.RU)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${lang === Language.RU ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
            >
              {t.russian}
            </button>
            <button 
              onClick={() => onLanguageChange(Language.UZ)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${lang === Language.UZ ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
            >
              {t.uzbek}
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-between mb-10 px-4">
            {[RegistrationStep.PHONE, RegistrationStep.OTP, RegistrationStep.INFO, RegistrationStep.ROLE].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-emerald-600 text-white shadow-xl scale-125' : 
                  (i < [RegistrationStep.PHONE, RegistrationStep.OTP, RegistrationStep.INFO, RegistrationStep.ROLE].indexOf(step) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400')
                }`}>
                  {i < [RegistrationStep.PHONE, RegistrationStep.OTP, RegistrationStep.INFO, RegistrationStep.ROLE].indexOf(step) ? <i className="fas fa-check"></i> : i + 1}
                </div>
                {i < 3 && <div className={`h-0.5 w-10 sm:w-16 mx-2 transition-all ${i < [RegistrationStep.PHONE, RegistrationStep.OTP, RegistrationStep.INFO, RegistrationStep.ROLE].indexOf(step) ? 'bg-emerald-200' : 'bg-slate-100'}`}></div>}
              </div>
            ))}
          </div>

          {step === RegistrationStep.PHONE && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.registration.phoneLabel}</label>
                <div className="relative group">
                  <i className="fas fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"></i>
                  <input 
                    type="tel" 
                    placeholder={t.registration.phonePlaceholder}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 transition-all font-bold"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black text-lg rounded-[24px] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all">
                {t.registration.sendSms}
              </button>
            </form>
          )}

          {step === RegistrationStep.OTP && (
            <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.registration.enterOtp}</label>
                <div className="relative group mt-2">
                  <i className="fas fa-key absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"></i>
                  <input 
                    type="text" 
                    maxLength={4}
                    placeholder={t.registration.otpPlaceholder}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 transition-all font-bold tracking-[1em] text-center text-xl"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <p className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 py-2 rounded-lg border border-emerald-100">
                  <i className="fas fa-info-circle mr-1"></i>
                  {lang === Language.RU ? `Демо-режим: используйте код ${mockCode}` : `Demo: ${mockCode} kodini ishlating`}
                </p>
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black text-lg rounded-[24px] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all">
                {t.registration.verify}
              </button>
              <div className="flex flex-col items-center gap-4">
                <button type="button" onClick={() => setStep(RegistrationStep.PHONE)} className="text-xs font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors">
                  {t.registration.changePhone}
                </button>
                <button type="button" onClick={() => {
                  const newCode = Math.floor(1000 + Math.random() * 9000).toString();
                  setMockCode(newCode);
                  setShowMockSms(true);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }} className="text-xs font-black text-emerald-600 hover:underline uppercase tracking-widest">
                  {t.registration.resend}
                </button>
              </div>
            </form>
          )}

          {step === RegistrationStep.INFO && (
            <form onSubmit={handleInfoSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
              <h2 className="text-xl font-black text-slate-800 mb-2">{t.registration.personalTitle}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.registration.firstName}</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.registration.lastName}</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                    value={formData.surname}
                    onChange={e => setFormData({...formData, surname: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.registration.birthDate}</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  value={formData.birthDate}
                  onChange={e => setFormData({...formData, birthDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.registration.bloodType}</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  value={formData.bloodType}
                  onChange={e => setFormData({...formData, bloodType: e.target.value})}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black text-lg rounded-[24px] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all">
                {t.registration.complete}
              </button>
            </form>
          )}

          {step === RegistrationStep.ROLE && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h2 className="text-xl font-black text-slate-800 mb-6 text-center">{t.roleSelector}</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { r: Role.PATIENT, icon: 'fa-user', color: 'bg-blue-50 text-blue-600', label: t.patient },
                  { r: Role.DOCTOR, icon: 'fa-user-md', color: 'bg-emerald-50 text-emerald-600', label: t.doctor },
                  { r: Role.PHARMACY, icon: 'fa-pills', color: 'bg-amber-50 text-amber-600', label: t.pharmacy },
                  { r: Role.CLINIC, icon: 'fa-hospital', color: 'bg-indigo-50 text-indigo-600', label: t.clinic }
                ].map(item => (
                  <button 
                    key={item.r}
                    onClick={() => handleRoleSelect(item.r)}
                    className="p-6 bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-2xl rounded-3xl flex flex-col items-center gap-4 transition-all group"
                  >
                    <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-active:scale-95 transition-all duration-300`}>
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <div className="font-bold text-slate-700 text-sm uppercase tracking-tight">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-10 text-slate-400 text-xs font-black uppercase tracking-[0.3em] opacity-40">
        Secure Digital Medical ID System
      </div>
    </div>
  );
};

export default Registration;
