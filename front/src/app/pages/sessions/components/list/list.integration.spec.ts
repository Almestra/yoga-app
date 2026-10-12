import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';

import { TEST_ADMIN_LOGIN, TEST_USER_LOGIN } from '../../../../../test-data/test-logins';
import { TEST_SESSIONS } from '../../../../../test-data/test-sessions';
import { AppComponent } from '../../../../app.component';
import { appConfig } from '../../../../app.config';
import { SessionInformation } from '../../../../core/models/sessionInformation.interface';
import { SessionService } from '../../../../core/service/session.service';
import { DetailComponent } from '../detail/detail.component';
import { FormComponent } from '../form/form.component';

describe('Session list', () => {
  const SESSIONS_URL = 'api/session';
  const SECOND_SESSION_URL = 'api/session/2';
  const TEACHERS_URL = 'api/teacher';

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

  it('should show the sessions sent by the server to a logged-in user', async () => {
    await openListAs(TEST_USER_LOGIN);

    expect(sessionNames()).toEqual(['Morning flow', 'Evening stretch']);
  });

  it('should open the detail of the session whose Detail button is clicked', async () => {
    await openListAs(TEST_USER_LOGIN);

    await clickSecond('Detail');

    expect(isDisplayed(DetailComponent)).toBe(true);
    httpCtrl.expectOne(SECOND_SESSION_URL);
  });

  it('should open the creation form when an admin clicks Create', async () => {
    await openListAs(TEST_ADMIN_LOGIN);

    await (await loader.getHarness(MatButtonHarness.with({ text: /Create$/ }))).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(isDisplayed(FormComponent)).toBe(true);
    expect(pageTitle()).toBe('Create session');
    httpCtrl.expectOne(TEACHERS_URL);
  });

  it('should open the update form of the session whose Edit button is clicked', async () => {
    await openListAs(TEST_ADMIN_LOGIN);

    await clickSecond('Edit');

    expect(isDisplayed(FormComponent)).toBe(true);
    expect(pageTitle()).toBe('Update session');
    httpCtrl.expectOne(SECOND_SESSION_URL);
  });

  async function openListAs(login: SessionInformation): Promise<void> {
    TestBed.inject(SessionService).logIn(login);
    await TestBed.inject(Router).navigateByUrl('/sessions');
    fixture.detectChanges();
    httpCtrl.expectOne(SESSIONS_URL).flush(TEST_SESSIONS);
    fixture.detectChanges();
  }

  async function clickSecond(label: string): Promise<void> {
    const buttons = await loader.getAllHarnesses(
      MatButtonHarness.with({ text: new RegExp(`${label}$`) }),
    );
    await buttons[1].click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function sessionNames(): string[] {
    return fixture.debugElement
      .queryAll(By.css('.item mat-card-title'))
      .map((title) => title.nativeElement.textContent.trim());
  }

  function pageTitle(): string {
    return fixture.nativeElement.querySelector('h1').textContent.trim();
  }

  function isDisplayed(page: Type<unknown>): boolean {
    return fixture.debugElement.query(By.directive(page)) !== null;
  }
});
