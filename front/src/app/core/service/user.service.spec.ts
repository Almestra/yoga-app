import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { TEST_USERS } from '../../../test-data/test-users';
import { User } from '../models/user.interface';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserService);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpCtrl.verify();
  });

  it('should ask the server for one user and return it', () => {
    let answer: User | undefined;

    service.getById('2').subscribe((user) => (answer = user));
    const req = httpCtrl.expectOne('api/user/2');
    req.flush(TEST_USERS[1]);

    expect(req.request.method).toBe('GET');
    expect(answer).toEqual(TEST_USERS[1]);
  });

  it('should ask the server to delete a user', () => {
    service.delete('2').subscribe();
    const req = httpCtrl.expectOne('api/user/2');
    req.flush(null);

    expect(req.request.method).toBe('DELETE');
  });
});
