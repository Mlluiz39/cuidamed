
import { Patient, Medication, HistoryRecord, AdherenceStatus } from './types';

export const mockPatients: Patient[] = [
  { id: 'p1', name: 'Maria Silva', birthDate: '1948-01-15', age: 75, phone: '11999999999', avatar: '', caregiverName: 'João Silva', caregiverPhone: '11988888888', lastAdherence: 95 },
  { id: 'p2', name: 'José Santos', birthDate: '1941-03-20', age: 82, phone: '11977777777', avatar: '', caregiverName: 'Ana Santos', caregiverPhone: '11966666666', lastAdherence: 88 },
  { id: 'p3', name: 'Antônia Oliveira', birthDate: '1945-07-08', age: 78, phone: '11955555555', avatar: '', caregiverName: 'Carlos Oliveira', caregiverPhone: '11944444444', lastAdherence: 92 },
];

export const mockMedications: Medication[] = [
  {
    id: 'm1',
    patientId: 'p1',
    name: 'Losartana 50mg',
    dosage: '1 comprimido',
    frequency: '2 vezes ao dia',
    times: ['08:00', '20:00'],
    timesMinutes: [480, 1200],
    active: true
  },
  {
    id: 'm2',
    patientId: 'p1',
    name: 'Metformina 850mg',
    dosage: '1 comprimido',
    frequency: '1 vez ao dia',
    times: ['12:00'],
    timesMinutes: [720],
    active: true
  },
  {
    id: 'm3',
    patientId: 'p2',
    name: 'Aspirina 100mg',
    dosage: '1 comprimido',
    frequency: '1 vez ao dia',
    times: ['09:00'],
    timesMinutes: [540],
    active: true
  }
];

export const mockHistory: HistoryRecord[] = [
  { id: 'h1', patientId: 'p1', organizationId: 'org1', medicationId: 'm1', scheduledTime: '08:00', scheduledMinutes: 480, status: AdherenceStatus.TAKEN, date: '2023-10-27', uniqueId: 'uid1', shortId: 'sid1' },
  { id: 'h2', patientId: 'p1', organizationId: 'org1', medicationId: 'm2', scheduledTime: '12:00', scheduledMinutes: 720, status: AdherenceStatus.PENDING, date: '2023-10-27', uniqueId: 'uid2', shortId: 'sid2' },
  { id: 'h3', patientId: 'p2', organizationId: 'org1', medicationId: 'm3', scheduledTime: '09:00', scheduledMinutes: 540, status: AdherenceStatus.MISSED, date: '2023-10-27', uniqueId: 'uid3', shortId: 'sid3' },
  { id: 'h4', patientId: 'p3', organizationId: 'org1', medicationId: 'm4', scheduledTime: '07:00', scheduledMinutes: 420, status: AdherenceStatus.TAKEN, date: '2023-10-27', uniqueId: 'uid4', shortId: 'sid4' },
];
