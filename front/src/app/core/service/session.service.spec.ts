import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { TEST_USER_LOGIN } from '../../../test-data/test-logins';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  let announcements: boolean[];

  beforeEach(() => {
    service = TestBed.inject(SessionService);
    announcements = [];
    service.$isLogged().subscribe((isLogged) => announcements.push(isLogged));
  });

  it('should start with nobody logged in', () => {
    expect(service.isLogged).toBe(false);
    expect(service.sessionInformation).toBeUndefined();
    expect(announcements).toEqual([false]);
  });

  it('should keep the user and announce the login', () => {
    service.logIn(TEST_USER_LOGIN);

    expect(service.isLogged).toBe(true);
    expect(service.sessionInformation).toEqual(TEST_USER_LOGIN);
    expect(announcements).toEqual([false, true]);
  });

  it('should forget the user and announce the logout', () => {
    service.logIn(TEST_USER_LOGIN);

    service.logOut();

    expect(service.isLogged).toBe(false);
    expect(service.sessionInformation).toBeUndefined();
    expect(announcements).toEqual([false, true, false]);
  });
});
