import { User } from '../app/core/models/user.interface';

// The server never sends the password.
export const TEST_USERS: Omit<User, 'password'>[] = [
  {
    id: 1,
    email: 'yoga@studio.com',
    lastName: 'Admin',
    firstName: 'Admin',
    admin: true,
    createdAt: new Date('2026-09-05T12:00:00Z'),
    updatedAt: new Date('2026-09-06T12:00:00Z'),
  },
  {
    id: 2,
    email: 'user@test.com',
    lastName: 'Test',
    firstName: 'User',
    admin: false,
    createdAt: new Date('2026-09-07T12:00:00Z'),
    updatedAt: new Date('2026-09-08T12:00:00Z'),
  },
];
