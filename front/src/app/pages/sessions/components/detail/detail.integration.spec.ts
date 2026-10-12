import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';

import { TEST_ADMIN_LOGIN, TEST_USER_LOGIN } from '../../../../../test-data/test-logins';
import { TEST_SESSIONS } from '../../../../../test-data/test-sessions';
import { TEST_TEACHERS } from '../../../../../test-data/test-teachers';
import { AppComponent } from '../../../../app.component';
import { appConfig } from '../../../../app.config';
import { Session } from '../../../../core/models/session.interface';
import { SessionInformation } from '../../../../core/models/sessionInformation.interface';
import { SessionService } from '../../../../core/service/session.service';
import { ListComponent } from '../list/list.component';

describe('Session detail', () => {
  const SESSION_URL = 'api/session/2';
  const PARTICIPATION_URL = `api/session/2/participate/${TEST_USER_LOGIN.id}`;
  const TEACHER_URL = 'api/teacher/2';
  const SESSION_WITHOUT_THE_USER: Session = { ...TEST_SESSIONS[1], users: [] };
  const SESSION_WITH_THE_USER: Session = { ...TEST_SESSIONS[1], users: [TEST_USER_LOGIN.id] };

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

  it('should enrol the user and show one more attendee when Participate is clicked', async () => {
    await openDetailAs(TEST_USER_LOGIN, SESSION_WITHOUT_THE_USER);

    await (await button('Participate')).click();
    httpCtrl.expectOne({ method: 'POST', url: PARTICIPATION_URL }).flush(null);
    answerDetailWith(SESSION_WITH_THE_USER);

    expect(attendees()).toBe('1 attendees');
    expect(await isOffered('Do not participate')).toBe(true);
    expect(await isOffered('Participate')).toBe(false);
  });

  it('should remove the user and show one attendee fewer when Do not participate is clicked', async () => {
    await openDetailAs(TEST_USER_LOGIN, SESSION_WITH_THE_USER);

    await (await button('Do not participate')).click();
    httpCtrl.expectOne({ method: 'DELETE', url: PARTICIPATION_URL }).flush(null);
    answerDetailWith(SESSION_WITHOUT_THE_USER);

    expect(attendees()).toBe('0 attendees');
    expect(await isOffered('Participate')).toBe(true);
    expect(await isOffered('Do not participate')).toBe(false);
  });

  it('should delete the session, say so and return to the list when an admin clicks Delete', async () => {
    await openDetailAs(TEST_ADMIN_LOGIN, SESSION_WITH_THE_USER);

    await (await button('Delete')).click();
    httpCtrl.expectOne({ method: 'DELETE', url: SESSION_URL }).flush(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(await notification()).toBe('Session deleted !');
    expect(isDisplayed(ListComponent)).toBe(true);
    httpCtrl.expectOne('api/session');
  });

  async function openDetailAs(login: SessionInformation, session: Session): Promise<void> {
    TestBed.inject(SessionService).logIn(login);
    await TestBed.inject(Router).navigateByUrl('/sessions/detail/2');
    fixture.detectChanges();
    answerDetailWith(session);
  }

  function answerDetailWith(session: Session): void {
    httpCtrl.expectOne({ method: 'GET', url: SESSION_URL }).flush(session);
    httpCtrl.expectOne(TEACHER_URL).flush(TEST_TEACHERS[1]);
    fixture.detectChanges();
  }

  function button(label: string): Promise<MatButtonHarness> {
    return loader.getHarness(MatButtonHarness.with({ text: new RegExp(`${label}$`) }));
  }

  async function isOffered(label: string): Promise<boolean> {
    const buttons = await loader.getAllHarnesses(
      MatButtonHarness.with({ text: new RegExp(`${label}$`) }),
    );

    return buttons.length === 1;
  }

  function attendees(): string {
    return fixture.nativeElement
      .querySelector('mat-card-content .my2 div:first-child span')
      .textContent.trim();
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
