import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { TEST_SESSIONS } from '../../../test-data/test-sessions';
import { Session } from '../models/session.interface';
import { SessionApiService } from './session-api.service';

describe('SessionApiService', () => {
  let service: SessionApiService;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SessionApiService);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpCtrl.verify();
  });

  it('should ask the server for the sessions and return them', () => {
    let answer: Session[] | undefined;

    service.all().subscribe((sessions) => (answer = sessions));
    const req = httpCtrl.expectOne('api/session');
    req.flush(TEST_SESSIONS);

    expect(req.request.method).toBe('GET');
    expect(answer).toEqual(TEST_SESSIONS);
  });
});
