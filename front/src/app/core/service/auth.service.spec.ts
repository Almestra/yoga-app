import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { TEST_USER_LOGIN } from '../../../test-data/test-logins';
import { LoginRequest } from '../models/loginRequest.interface';
import { SessionInformation } from '../models/sessionInformation.interface';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpCtrl.verify();
  });

  it('should send the email and the password to the server and return its answer', () => {
    const credentials: LoginRequest = { email: 'user@test.com', password: 'test!1234' };
    let answer: SessionInformation | undefined;

    service.login(credentials).subscribe((sessionInformation) => (answer = sessionInformation));
    const req = httpCtrl.expectOne('/api/auth/login');
    req.flush(TEST_USER_LOGIN);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    expect(answer).toEqual(TEST_USER_LOGIN);
  });
});
