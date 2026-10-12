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

import { TEST_ADMIN_LOGIN, TEST_USER_LOGIN } from '../../../test-data/test-logins';
import { TEST_USERS } from '../../../test-data/test-users';
import { AppComponent } from '../../app.component';
import { appConfig } from '../../app.config';
import { SessionInformation } from '../../core/models/sessionInformation.interface';
import { User } from '../../core/models/user.interface';
import { SessionService } from '../../core/service/session.service';
import { LoginComponent } from '../../pages/login/login.component';
import { MeComponent } from './me.component';

describe('Account', () => {
  const ADMIN = TEST_USERS[0];
  const USER = TEST_USERS[1];

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

  it('should show an admin their own information, "You are admin" and no Delete button', async () => {
    await openAccountAs(TEST_ADMIN_LOGIN, ADMIN);

    expect(paragraphs()).toEqual([
      'Name: Admin ADMIN',
      'Email: yoga@studio.com',
      'You are admin',
      'Create at: September 5, 2026',
      'Last update: September 6, 2026',
    ]);
    expect(await deleteButtons()).toHaveLength(0);
  });

  it('should show a user who is not an admin their own information and the Delete button', async () => {
    await openAccountAs(TEST_USER_LOGIN, USER);

    expect(paragraphs()).toEqual([
      'Name: User TEST',
      'Email: user@test.com',
      'Delete my account:',
      'Create at: September 7, 2026',
      'Last update: September 8, 2026',
    ]);
    expect(await deleteButtons()).toHaveLength(1);
  });

  it('should delete the account, say so, log the user out and show the login page when Delete is clicked', async () => {
    await openAccountAs(TEST_USER_LOGIN, USER);

    await (await deleteButtons())[0].click();
    httpCtrl.expectOne({ method: 'DELETE', url: 'api/user/2' }).flush(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(await notification()).toBe('Your account has been deleted !');
    expect(isDisplayed(LoginComponent)).toBe(true);
    expect(navItemLabels()).toEqual(['Login', 'Register']);
  });

  it('should display "An error occurred" and keep the user on the account page when the deletion fails', async () => {
    await openAccountAs(TEST_USER_LOGIN, USER);

    await (await deleteButtons())[0].click();
    httpCtrl
      .expectOne({ method: 'DELETE', url: 'api/user/2' })
      .flush('', { status: 500, statusText: 'Internal Server Error' });

    expect(await notification()).toBe('An error occurred');
    expect(isDisplayed(MeComponent)).toBe(true);
    expect(navItemLabels()).toEqual(['Sessions', 'Account', 'Logout']);
  });

  async function openAccountAs(login: SessionInformation, user: Partial<User>): Promise<void> {
    TestBed.inject(SessionService).logIn(login);
    await TestBed.inject(Router).navigateByUrl('/me');
    fixture.detectChanges();
    httpCtrl.expectOne({ method: 'GET', url: `api/user/${login.id}` }).flush(user);
    fixture.detectChanges();
  }

  function paragraphs(): string[] {
    return fixture.debugElement
      .queryAll(By.css('mat-card-content p'))
      .map((paragraph) => paragraph.nativeElement.textContent.replace(/\s+/g, ' ').trim());
  }

  function deleteButtons(): Promise<MatButtonHarness[]> {
    return loader.getAllHarnesses(MatButtonHarness.with({ text: /Delete$/ }));
  }

  async function notification(): Promise<string> {
    const snackBar =
      await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(MatSnackBarHarness);

    return snackBar.getMessage();
  }

  function isDisplayed(page: Type<unknown>): boolean {
    return fixture.debugElement.query(By.directive(page)) !== null;
  }

  function navItemLabels(): string[] {
    return fixture.debugElement
      .queryAll(By.css('mat-toolbar .link'))
      .map((item) => item.nativeElement.textContent.trim());
  }
});
