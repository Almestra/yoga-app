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
