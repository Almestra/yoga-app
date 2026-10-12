import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { of, Subject } from 'rxjs';

import { TEST_ADMIN_LOGIN, TEST_USER_LOGIN } from '../../../../../test-data/test-logins';
import { TEST_SESSIONS } from '../../../../../test-data/test-sessions';
import { TEST_TEACHERS } from '../../../../../test-data/test-teachers';
import { Session } from '../../../../core/models/session.interface';
import { SessionInformation } from '../../../../core/models/sessionInformation.interface';
import { SessionService } from '../../../../core/service/session.service';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { DetailComponent } from './detail.component';

describe('DetailComponent', () => {
  const SESSION_WITHOUT_THE_USER = TEST_SESSIONS[0];
  const SESSION_WITH_THE_USER = TEST_SESSIONS[1];

  let fixture: ComponentFixture<DetailComponent>;
  let loader: HarnessLoader;
  let sessionApiService: {
    detail: jest.Mock;
    delete: jest.Mock;
    participate: jest.Mock;
    unParticipate: jest.Mock;
  };
  let teacherService: { detail: jest.Mock };

  beforeEach(() => {
    sessionApiService = {
      detail: jest.fn(),
      delete: jest.fn(),
      participate: jest.fn(),
      unParticipate: jest.fn(),
    };
    teacherService = { detail: jest.fn() };
    TestBed.configureTestingModule({
      imports: [DetailComponent],
      providers: [
        { provide: SessionApiService, useValue: sessionApiService },
        { provide: TeacherService, useValue: teacherService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '2' }) } },
        },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Session', () => {
    it('should display the session, its teacher and its dates', () => {
      display(SESSION_WITH_THE_USER, TEST_USER_LOGIN);

      expect({
        name: textOf('h1'),
        teacher: textOf('mat-card-subtitle span'),
        attendees: textOf('mat-card-content .my2 div:first-child span'),
        date: textOf('mat-card-content .my2 div:last-child span'),
        description: textOf('.description'),
        created: textOf('.created'),
        updated: textOf('.updated'),
      }).toEqual({
        name: 'Evening Stretch',
        teacher: 'Hélène THIERCELIN',
        attendees: '1 attendees',
        date: 'November 2, 2026',
        description: 'Description: Slow postures to end the day',
        created: 'Create at: October 3, 2026',
        updated: 'Last update: October 4, 2026',
      });
    });
  });

  describe('Buttons', () => {
    it('should offer Delete only to an admin', async () => {
      display(SESSION_WITH_THE_USER, TEST_ADMIN_LOGIN);

      expect(await buttonCounts()).toEqual({ delete: 1, participate: 0, doNotParticipate: 0 });
    });

    it('should offer Participate to a user who is not enrolled', async () => {
      display(SESSION_WITHOUT_THE_USER, TEST_USER_LOGIN);

      expect(await buttonCounts()).toEqual({ delete: 0, participate: 1, doNotParticipate: 0 });
    });

    it('should offer Do not participate to a user who is enrolled', async () => {
      display(SESSION_WITH_THE_USER, TEST_USER_LOGIN);

      expect(await buttonCounts()).toEqual({ delete: 0, participate: 0, doNotParticipate: 1 });
    });
  });

  describe('When an action fails', () => {
    it('should display "An error occurred" when the enrolment fails', async () => {
      const answer = new Subject<void>();
      sessionApiService.participate.mockReturnValue(answer);
      display(SESSION_WITHOUT_THE_USER, TEST_USER_LOGIN);

      await (await button('Participate')).click();
      answer.error(new HttpErrorResponse({ status: 500 }));

      expect(await notification()).toBe('An error occurred');
    });

    it('should display "An error occurred" when leaving the session fails', async () => {
      const answer = new Subject<void>();
      sessionApiService.unParticipate.mockReturnValue(answer);
      display(SESSION_WITH_THE_USER, TEST_USER_LOGIN);

      await (await button('Do not participate')).click();
      answer.error(new HttpErrorResponse({ status: 500 }));

      expect(await notification()).toBe('An error occurred');
    });

    it('should display "An error occurred" when the deletion fails', async () => {
      const answer = new Subject<void>();
      sessionApiService.delete.mockReturnValue(answer);
      display(SESSION_WITH_THE_USER, TEST_ADMIN_LOGIN);

      await (await button('Delete')).click();
      answer.error(new HttpErrorResponse({ status: 500 }));

      expect(await notification()).toBe('An error occurred');
    });
  });

  describe('Back arrow', () => {
    it('should ask the browser to go back to the previous page', async () => {
      const back = jest.spyOn(window.history, 'back').mockImplementation(() => undefined);
      display(SESSION_WITH_THE_USER, TEST_USER_LOGIN);

      await (await loader.getHarness(MatButtonHarness.with({ text: 'arrow_back' }))).click();

      expect(back).toHaveBeenCalled();
    });
  });

  function display(session: Session, login: SessionInformation): void {
    sessionApiService.detail.mockReturnValue(of(session));
    teacherService.detail.mockReturnValue(of(TEST_TEACHERS[1]));
    TestBed.inject(SessionService).logIn(login);
    fixture = TestBed.createComponent(DetailComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  }

  function textOf(selector: string): string {
    const element: HTMLElement = fixture.nativeElement.querySelector(selector);

    return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  async function buttonCounts(): Promise<{
    delete: number;
    participate: number;
    doNotParticipate: number;
  }> {
    return {
      delete: (await buttons('Delete')).length,
      participate: (await buttons('Participate')).length,
      doNotParticipate: (await buttons('Do not participate')).length,
    };
  }

  function buttons(label: string): Promise<MatButtonHarness[]> {
    return loader.getAllHarnesses(MatButtonHarness.with({ text: new RegExp(`${label}$`) }));
  }

  function button(label: string): Promise<MatButtonHarness> {
    return loader.getHarness(MatButtonHarness.with({ text: new RegExp(`${label}$`) }));
  }

  async function notification(): Promise<string> {
    const snackBar =
      await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(MatSnackBarHarness);

    return snackBar.getMessage();
  }
});
