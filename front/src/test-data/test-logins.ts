import { SessionInformation } from '../app/core/models/sessionInformation.interface';

export const TEST_USER_LOGIN: SessionInformation = {
  token: 'user-token',
  type: 'Bearer',
  id: 2,
  username: 'user@test.com',
  firstName: 'User',
  lastName: 'Test',
  admin: false,
};

export const TEST_ADMIN_LOGIN: SessionInformation = {
  token: 'admin-token',
  type: 'Bearer',
  id: 1,
  username: 'yoga@studio.com',
  firstName: 'Admin',
  lastName: 'Admin',
  admin: true,
};
