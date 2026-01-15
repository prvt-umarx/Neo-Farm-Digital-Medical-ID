
import React, { useState } from 'react';
import { Role, Language } from '../types';
import { translations } from '../translations';

interface Props {
  role: Role;
  lang: Language;
  onComplete: () => void;
}

const Onboarding: React.FC<Props> = ({ role, lang, onComplete }) => {
  const [step, setStep] = useState(0);
  const t = translations[lang];
  
  const getRoleSteps = () => {
    switch (role) {
      case Role.PATIENT: return t.onboarding.patient;
      case Role.DOCTOR: return t.onboarding.doctor;
      case Role.PHARMACY: return t.onboarding.pharmacy;
      case Role.CLINIC: return t.onboarding.clinic;
      default: return [];
    }
  };

  const steps = getRoleSteps();
  const currentStep = steps[step];

  const getThemeColors = () => {
    switch (role) {
      case Role.PATIENT: return { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' };
      case Role.DOCTOR: return { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50' };
      case Role.PHARMACY: return { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50' };
      case Role.CLINIC: return { bg: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50' };
      default: return { bg: 'bg-slate-600', text: 'text-slate-600', light: 'bg-slate-50' };
    }
  };

  const colors = getThemeColors();

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-300">
        <div className={`${colors.bg} h-32 flex items-center justify-center text-white relative`}>
          <div className="text-5xl opacity-20 absolute top-4 left-4">
             {role === Role.PATIENT && <i className="fas fa-user-shield"></i>}
             {role === Role.DOCTOR && <i className="fas fa-user-md"></i>}
             {role === Role.PHARMACY && <i className="fas fa-pills"></i>}
             {role === Role.CLINIC && <i className="fas fa-hospital"></i>}
          </div>
          <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl">
             <span className={colors.text}>
               {step === 0 && <i className="fas fa-info-circle animate-pulse"></i>}
               {step === 1 && <i className="fas fa-shield-alt"></i>}
               {step === 2 && <i className="fas fa-check-circle"></i>}
             </span>
          </div>
        </div>
        
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{currentStep.title}</h2>
          <p className="text-slate-500 leading-relaxed mb-8 min-h-[80px]">
            {currentStep.text}
          </p>

          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? `w-8 ${colors.bg}` : 'w-2 bg-slate-200'}`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform active:scale-95 transition-all ${colors.bg}`}
          >
            {step === steps.length - 1 ? t.onboarding.start : t.onboarding.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
