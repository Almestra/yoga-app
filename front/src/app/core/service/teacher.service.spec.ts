import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { TEST_TEACHERS } from '../../../test-data/test-teachers';
import { Teacher } from '../models/teacher.interface';
import { TeacherService } from './teacher.service';

describe('TeacherService', () => {
  let service: TeacherService;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TeacherService);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpCtrl.verify();
  });

  it('should ask the server for one teacher and return it', () => {
    let answer: Teacher | undefined;

    service.detail('2').subscribe((teacher) => (answer = teacher));
    const req = httpCtrl.expectOne('api/teacher/2');
    req.flush(TEST_TEACHERS[1]);

    expect(req.request.method).toBe('GET');
    expect(answer).toEqual(TEST_TEACHERS[1]);
  });
});
