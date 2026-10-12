import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';

import { TEST_ADMIN_LOGIN, TEST_USER_LOGIN } from '../../../../../test-data/test-logins';
import { TEST_SESSION_ENTRY, TEST_SESSIONS } from '../../../../../test-data/test-sessions';
import { TEST_TEACHERS } from '../../../../../test-data/test-teachers';
import { AppComponent } from '../../../../app.component';
import { appConfig } from '../../../../app.config';
import { SessionInformation } from '../../../../core/models/sessionInformation.interface';
import { SessionService } from '../../../../core/service/session.service';
import { ListComponent } from '../list/list.component';
import { FormComponent } from './form.component';

describe('Session form', () => {
  const SESSIONS_URL = 'api/session';
  const SESSION_URL = 'api/session/2';
  const TEACHERS_URL = 'api/teacher';
  const CREATION_PAGE = '/sessions/create';
  const UPDATE_PAGE = '/sessions/update/2';

  let fixture: ComponentFixture<AppComponent>;
  let loader: HarnessLoader;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AppComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpCtrl.verify();
  });

  describe('Creation', () => {
    it('should send the typed session, say so and return to the list when Save is clicked', async () => {
      await openCreation();
      await (await inputOf('name')).setValue(TEST_SESSION_ENTRY.name);
      await (await inputOf('date')).setValue(TEST_SESSION_ENTRY.date);
      await (await teacherSelect()).clickOptions({ text: TEST_SESSION_ENTRY.teacher });
      await (await inputOf('description')).setValue(TEST_SESSION_ENTRY.description);

      await (await saveButton()).click();
      const req = httpCtrl.expectOne({ method: 'POST', url: SESSIONS_URL });
      req.flush(TEST_SESSIONS[0]);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(req.request.body).toEqual({
        name: 'Sunday relax',
        date: '2026-12-06',
        teacher_id: 1,
        description: 'A quiet hour to end the week',
      });
      expect(await notification()).toBe('Session created !');
      expect(isDisplayed(ListComponent)).toBe(true);
      httpCtrl.expectOne({ method: 'GET', url: SESSIONS_URL });
    });

    it('should return to the list when the back arrow is clicked', async () => {
      await openCreation();

      await (await loader.getHarness(MatButtonHarness.with({ text: 'arrow_back' }))).click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(isDisplayed(ListComponent)).toBe(true);
      httpCtrl.expectOne(SESSIONS_URL);
    });
  });

  describe('Update', () => {
    it('should show the current values of the session', async () => {
      await openUpdate();

      expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Update session');
      expect({
        name: await (await inputOf('name')).getValue(),
        date: await (await inputOf('date')).getValue(),
        teacher: await (await teacherSelect()).getValueText(),
        description: await (await inputOf('description')).getValue(),
      }).toEqual({
        name: 'Evening stretch',
        date: '2026-11-02',
        teacher: 'Hélène Thiercelin',
        description: 'Slow postures to end the day',
      });
    });

    it('should send the changed session, say so and return to the list when Save is clicked', async () => {
      await openUpdate();
      await (await inputOf('description')).setValue('A longer evening session');

      await (await saveButton()).click();
      const req = httpCtrl.expectOne({ method: 'PUT', url: SESSION_URL });
      req.flush(TEST_SESSIONS[1]);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(req.request.body).toEqual({
        name: 'Evening stretch',
        date: '2026-11-02',
        teacher_id: 2,
        description: 'A longer evening session',
      });
      expect(await notification()).toBe('Session updated !');
      expect(isDisplayed(ListComponent)).toBe(true);
      httpCtrl.expectOne({ method: 'GET', url: SESSIONS_URL });
    });

    it('should display "An error occurred" and stay on the form when the update fails', async () => {
      await openUpdate();

      await (await saveButton()).click();
      httpCtrl
        .expectOne({ method: 'PUT', url: SESSION_URL })
        .flush('', { status: 500, statusText: 'Internal Server Error' });

      expect(await notification()).toBe('An error occurred');
      expect(isDisplayed(FormComponent)).toBe(true);
    });
  });

  describe('When the user is not an admin', () => {
    for (const [page, requestOfTheForm] of [
      [CREATION_PAGE, TEACHERS_URL],
      [UPDATE_PAGE, SESSION_URL],
    ]) {
      it(`should send the user who opens ${page} back to the list`, async () => {
        await open(page, TEST_USER_LOGIN);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(isDisplayed(ListComponent)).toBe(true);
        expect(isDisplayed(FormComponent)).toBe(false);
        httpCtrl.expectOne(requestOfTheForm);
        httpCtrl.expectOne(SESSIONS_URL);
      });
    }
  });

  async function openCreation(): Promise<void> {
    await open(CREATION_PAGE, TEST_ADMIN_LOGIN);
    httpCtrl.expectOne(TEACHERS_URL).flush(TEST_TEACHERS);
    fixture.detectChanges();
  }

  async function openUpdate(): Promise<void> {
    await open(UPDATE_PAGE, TEST_ADMIN_LOGIN);
    httpCtrl.expectOne(SESSION_URL).flush(TEST_SESSIONS[1]);
    fixture.detectChanges();
    httpCtrl.expectOne(TEACHERS_URL).flush(TEST_TEACHERS);
    fixture.detectChanges();
  }

  async function open(page: string, login: SessionInformation): Promise<void> {
    TestBed.inject(SessionService).logIn(login);
    await TestBed.inject(Router).navigateByUrl(page);
    fixture.detectChanges();
  }

  function inputOf(field: string): Promise<MatInputHarness> {
    return loader.getHarness(MatInputHarness.with({ selector: `[formControlName="${field}"]` }));
  }

  function teacherSelect(): Promise<MatSelectHarness> {
    return loader.getHarness(MatSelectHarness);
  }

  function saveButton(): Promise<MatButtonHarness> {
    return loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
  }

  async function notification(): Promise<string> {
    const snackBar =
      await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(MatSnackBarHarness);

    return snackBar.getMessage();
  }

  function isDisplayed(page: Type<unknown>): boolean {
    return fixture.debugElement.query(By.directive(page)) !== null;
  }
});
