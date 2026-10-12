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

  it('should ask the server for one session and return it', () => {
    let answer: Session | undefined;

    service.detail('2').subscribe((session) => (answer = session));
    const req = httpCtrl.expectOne('api/session/2');
    req.flush(TEST_SESSIONS[1]);

    expect(req.request.method).toBe('GET');
    expect(answer).toEqual(TEST_SESSIONS[1]);
  });

  it('should ask the server to delete a session', () => {
    service.delete('2').subscribe();
    const req = httpCtrl.expectOne('api/session/2');
    req.flush(null);

    expect(req.request.method).toBe('DELETE');
  });

  it('should ask the server to enrol a user in a session', () => {
    service.participate('2', '3').subscribe();
    const req = httpCtrl.expectOne('api/session/2/participate/3');
    req.flush(null);

    expect(req.request.method).toBe('POST');
  });

  it('should ask the server to remove a user from a session', () => {
    service.unParticipate('2', '3').subscribe();
    const req = httpCtrl.expectOne('api/session/2/participate/3');
    req.flush(null);

    expect(req.request.method).toBe('DELETE');
  });

  it('should send the session to create and return the one the server answers', () => {
    let answer: Session | undefined;

    service.create(TEST_SESSIONS[0]).subscribe((session) => (answer = session));
    const req = httpCtrl.expectOne('api/session');
    req.flush(TEST_SESSIONS[1]);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(TEST_SESSIONS[0]);
    expect(answer).toEqual(TEST_SESSIONS[1]);
  });

  it('should send the session to update and return the one the server answers', () => {
    let answer: Session | undefined;

    service.update('2', TEST_SESSIONS[0]).subscribe((session) => (answer = session));
    const req = httpCtrl.expectOne('api/session/2');
    req.flush(TEST_SESSIONS[1]);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(TEST_SESSIONS[0]);
    expect(answer).toEqual(TEST_SESSIONS[1]);
  });
});
