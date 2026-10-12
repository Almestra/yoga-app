import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { TEST_USER_LOGIN } from '../../test-data/test-logins';
import { SessionService } from '../core/service/session.service';
import { customJwtInterceptorFn } from './customJwtInterceptorFn';

describe('customJwtInterceptorFn', () => {
  const ANY_URL = '/api/anything';

  let httpClient: HttpClient;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([customJwtInterceptorFn])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpCtrl.verify();
  });

  it('should add the token of the logged-in user to a request', () => {
    TestBed.inject(SessionService).logIn(TEST_USER_LOGIN);

    httpClient.get(ANY_URL).subscribe();

    const req = httpCtrl.expectOne(ANY_URL);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${TEST_USER_LOGIN.token}`);
  });

  it('should not add any token to the request of a visitor', () => {
    httpClient.get(ANY_URL).subscribe();

    const req = httpCtrl.expectOne(ANY_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
  });
});
