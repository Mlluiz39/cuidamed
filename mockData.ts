
import { Patient, Medication, HistoryRecord, AdherenceStatus } from './types';

export const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Dona Maria Silva',
    age: 78,
    phone: '+55 11 98888-1111',
    avatar: 'https://picsum.photos/seed/maria/200/200',
    caregiverName: 'Ana Clara (Filha)',
    caregiverPhone: '+55 11 97777-2222',
    lastAdherence: 92
  },
  {
    id: 'p2',
    name: 'Sr. João Oliveira',
    age: 82,
    phone: '+55 11 98888-3333',
    avatar: 'https://picsum.photos/seed/joao/200/200',
    caregiverName: 'Carlos Oliveira (Neto)',
    caregiverPhone: '+55 11 97777-4444',
    lastAdherence: 65
  },
  {
    id: 'p3',
    name: 'Dona Helena Souza',
    age: 75,
    phone: '+55 11 98888-5555',
    avatar: 'https://picsum.photos/seed/helena/200/200',
    caregiverName: 'Márcia Souza (Cuidadora)',
    caregiverPhone: '+55 11 97777-6666',
    lastAdherence: 98
  }
];

export const mockMedications: Medication[] = [
  {
    id: 'm1',
    patientId: 'p1',
    name: 'Losartana 50mg',
    dosage: '1 comprimido',
    frequency: '2 vezes ao dia',
    times: ['08:00', '20:00'],
    active: true
  },
  {
    id: 'm2',
    patientId: 'p1',
    name: 'Metformina 850mg',
    dosage: '1 comprimido',
    frequency: '1 vez ao dia',
    times: ['12:00'],
    active: true
  },
  {
    id: 'm3',
    patientId: 'p2',
    name: 'Aspirina 100mg',
    dosage: '1 comprimido',
    frequency: '1 vez ao dia',
    times: ['09:00'],
    active: true
  }
];

export const mockHistory: HistoryRecord[] = [
  { id: 'h1', patientId: 'p1', medicationName: 'Losartana 50mg', scheduledTime: '08:00', actualTime: '08:05', status: AdherenceStatus.TAKEN, date: '2023-10-27' },
  { id: 'h2', patientId: 'p1', medicationName: 'Metformina 850mg', scheduledTime: '12:00', status: AdherenceStatus.PENDING, date: '2023-10-27' },
  { id: 'h3', patientId: 'p2', medicationName: 'Aspirina 100mg', scheduledTime: '09:00', status: AdherenceStatus.MISSED, date: '2023-10-27' },
  { id: 'h4', patientId: 'p3', medicationName: 'Vitamina D', scheduledTime: '07:00', actualTime: '07:00', status: AdherenceStatus.TAKEN, date: '2023-10-27' },
];
