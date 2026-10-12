import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';

import { TEST_USER_LOGIN } from '../../../test-data/test-logins';
import { AppComponent } from '../../app.component';
import { appConfig } from '../../app.config';
import { ListComponent } from '../sessions/components/list/list.component';
import { LoginComponent } from './login.component';

describe('Login', () => {
  const EMAIL = 'user@test.com';
  const PASSWORD = 'test!1234';
  const LOGIN_URL = '/api/auth/login';
  const SESSIONS_URL = 'api/session';

  let fixture: ComponentFixture<AppComponent>;
  let loader: HarnessLoader;
  let httpCtrl: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AppComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    httpCtrl = TestBed.inject(HttpTestingController);
    await TestBed.inject(Router).navigateByUrl('/login');
    fixture.detectChanges();
  });

  afterEach(() => {
    httpCtrl.verify();
  });

  it('should send the credentials, show the session list and use the token when the server accepts them', async () => {
    await submit(EMAIL, PASSWORD);
    const login = httpCtrl.expectOne(LOGIN_URL);
    login.flush(TEST_USER_LOGIN);
    await fixture.whenStable();
    fixture.detectChanges();
    const sessions = httpCtrl.expectOne(SESSIONS_URL);
    sessions.flush([]);

    expect(login.request.body).toEqual({ email: EMAIL, password: PASSWORD });
    expect(isDisplayed(ListComponent)).toBe(true);
    expect(navItemLabels()).toEqual(['Sessions', 'Account', 'Logout']);
    expect(sessions.request.headers.get('Authorization')).toBe(`Bearer ${TEST_USER_LOGIN.token}`);
  });

  it('should say that the credentials are incorrect and stay on the login page when the server refuses them', async () => {
    await submit(EMAIL, PASSWORD);
    httpCtrl.expectOne(LOGIN_URL).flush('', { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(serverMessage()).toBe('Incorrect email or password');
    expect(isDisplayed(LoginComponent)).toBe(true);
    expect(navItemLabels()).toEqual(['Login', 'Register']);
  });

  async function submit(email: string, password: string): Promise<void> {
    const emailInput = await loader.getHarness(
      MatInputHarness.with({ selector: '[formControlName="email"]' }),
    );
    const passwordInput = await loader.getHarness(
      MatInputHarness.with({ selector: '[formControlName="password"]' }),
    );
    await emailInput.setValue(email);
    await passwordInput.setValue(password);
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }))).click();
  }

  function isDisplayed(page: Type<unknown>): boolean {
    return fixture.debugElement.query(By.directive(page)) !== null;
  }

  function navItemLabels(): string[] {
    return fixture.debugElement
      .queryAll(By.css('mat-toolbar .link'))
      .map((item) => item.nativeElement.textContent.trim());
  }

  function serverMessage(): string {
    return fixture.nativeElement.querySelector('.error').textContent.trim();
  }
});
