
export enum Role {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  PHARMACY = 'PHARMACY',
  CLINIC = 'CLINIC'
}

export enum Language {
  RU = 'ru',
  UZ = 'uz'
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE'
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface Diagnosis {
  id: string;
  date: string;
  doctorName: string;
  doctorSpecialty: string;
  condition: string;
  notes: string;
}

export interface Prescription {
  id: string;
  date: string;
  doctorName: string;
  medication: string;
  dosage: string;
  duration: string;
  isFilled: boolean;
  linkedDiagnosisId?: string;
}

export interface ClinicDoctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  location: string;
  languages: string[];
  status: AvailabilityStatus;
  clinicName?: string;
  clinicRating?: number;
  bio?: string;
  education?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  status: AppointmentStatus;
}

export interface Review {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  surname: string;
  birthDate: string;
  bloodType: string;
  allergies: string[];
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
  rating: number; // 0-5
  reviewsCount: number;
  aiSummary?: string;
  // Doctor/Clinic specific info
  bio?: string;
  experience?: string;
  education?: string;
  specialty?: string;
  address?: string;
  accessLog: {
    id: string;
    accessorName: string;
    role: Role;
    timestamp: string;
  }[];
}

export enum RegistrationStep {
  PHONE = 'PHONE',
  OTP = 'OTP',
  INFO = 'INFO',
  ROLE = 'ROLE'
}
