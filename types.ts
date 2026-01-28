
export enum AdherenceStatus {
  TAKEN = 'taken',
  MISSED = 'missed',
  PENDING = 'pending',
  DELAYED = 'delayed'
}

export interface Patient {
  birthDate: string;
  id: string;
  name: string;
  age: number;
  phone: string;
  avatar: string;
  caregiverName: string;
  caregiverPhone: string;
  lastAdherence: number; // percentage
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[]; // e.g., ["08:00", "20:00"]
  active: boolean;
}

export interface HistoryRecord {
  id: string;
  patientId: string;
  medicationName: string;
  scheduledTime: string;
  actualTime?: string;
  status: AdherenceStatus;
  date: string;
}

export interface DashboardStats {
  activePatients: number;
  adherenceRate: number;
  pendingAlerts: number;
  medicationsToday: number;
}
