import { Session } from '../app/core/models/session.interface';

export const TEST_SESSIONS: Session[] = [
  {
    id: 1,
    name: 'Morning flow',
    description: 'A gentle start of the day',
    date: new Date('2026-10-15T12:00:00Z'),
    teacher_id: 1,
    users: [],
    createdAt: new Date('2026-10-01T12:00:00Z'),
    updatedAt: new Date('2026-10-02T12:00:00Z'),
  },
  {
    id: 2,
    name: 'Evening stretch',
    description: 'Slow postures to end the day',
    date: new Date('2026-11-02T12:00:00Z'),
    teacher_id: 2,
    users: [2],
    createdAt: new Date('2026-10-03T12:00:00Z'),
    updatedAt: new Date('2026-10-04T12:00:00Z'),
  },
];

export const TEST_SESSION_ENTRY = {
  name: 'Sunday relax',
  date: '2026-12-06',
  teacher: 'Margot Delahaye',
  description: 'A quiet hour to end the week',
};
