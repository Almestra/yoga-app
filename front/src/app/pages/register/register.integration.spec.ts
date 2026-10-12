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

import { TEST_REGISTRATION } from '../../../test-data/test-registrations';
import { AppComponent } from '../../app.component';
import { appConfig } from '../../app.config';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from './register.component';

describe('Registration', () => {
  const REGISTER_URL = '/api/auth/register';

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
    await TestBed.inject(Router).navigateByUrl('/register');
    fixture.detectChanges();
  });

  afterEach(() => {
    httpCtrl.verify();
  });

  it('should send the registration and show the login page when the server accepts it', async () => {
    await submitRegistration();
    const registration = httpCtrl.expectOne(REGISTER_URL);
    registration.flush({ message: 'User registered successfully!' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(registration.request.body).toEqual(TEST_REGISTRATION);
    expect(isDisplayed(LoginComponent)).toBe(true);
  });

  it('should say that the email is already used and stay on the page when the server refuses it', async () => {
    await submitRegistration();
    httpCtrl
      .expectOne(REGISTER_URL)
      .flush(
        { message: 'Error: Email is already taken!' },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();

    expect(serverMessage()).toBe('This email is already used');
    expect(isDisplayed(RegisterComponent)).toBe(true);
  });

  async function submitRegistration(): Promise<void> {
    await type('firstName', TEST_REGISTRATION.firstName);
    await type('lastName', TEST_REGISTRATION.lastName);
    await type('email', TEST_REGISTRATION.email);
    await type('password', TEST_REGISTRATION.password);
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }))).click();
  }

  async function type(field: string, value: string): Promise<void> {
    const input = await loader.getHarness(
      MatInputHarness.with({ selector: `[formControlName="${field}"]` }),
    );
    await input.setValue(value);
  }

  function isDisplayed(page: Type<unknown>): boolean {
    return fixture.debugElement.query(By.directive(page)) !== null;
  }

  function serverMessage(): string {
    return fixture.nativeElement.querySelector('.error').textContent.trim();
  }
});
