import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';

import { TEST_USER_LOGIN } from '../test-data/test-logins';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { MeComponent } from './components/me/me.component';
import { SessionService } from './core/service/session.service';
import { LoginComponent } from './pages/login/login.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { RegisterComponent } from './pages/register/register.component';
import { ListComponent } from './pages/sessions/components/list/list.component';

describe('Application frame', () => {
  const SESSIONS_URL = 'api/session';
  const USER_URL = `api/user/${TEST_USER_LOGIN.id}`;

  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpCtrl.verify();
  });

  describe('When nobody is logged in', () => {
    it('should show the login page when the application is opened', async () => {
      await visit('/');

      expect(isDisplayed(LoginComponent)).toBe(true);
    });

    for (const reservedUrl of [
      '/sessions',
      '/sessions/detail/1',
      '/sessions/create',
      '/sessions/update/1',
      '/me',
    ]) {
      it(`should send a visitor who asks for ${reservedUrl} back to the login page`, async () => {
        await visit(reservedUrl);

        expect(isDisplayed(LoginComponent)).toBe(true);
      });
    }

    it('should lead an unknown address to the not-found page', async () => {
      await visit('/unknown-address');

      expect(isDisplayed(NotFoundComponent)).toBe(true);
    });

    it('should open the register page when Register is clicked', async () => {
      await visit('/login');

      await clickNavItem('Register');

      expect(isDisplayed(RegisterComponent)).toBe(true);
    });

    it('should open the login page when Login is clicked', async () => {
      await visit('/register');

      await clickNavItem('Login');

      expect(isDisplayed(LoginComponent)).toBe(true);
    });
  });

  describe('When a user is logged in', () => {
    beforeEach(() => {
      TestBed.inject(SessionService).logIn(TEST_USER_LOGIN);
    });

    for (const visitorUrl of ['/login', '/register']) {
      it(`should send a user who goes back to ${visitorUrl} to the session list`, async () => {
        await visit(visitorUrl);
        httpCtrl.expectOne(SESSIONS_URL).flush([]);

        expect(isDisplayed(ListComponent)).toBe(true);
      });
    }

    it('should open the account page when Account is clicked', async () => {
      await visit('/sessions');
      httpCtrl.expectOne(SESSIONS_URL).flush([]);

      await clickNavItem('Account');

      expect(isDisplayed(MeComponent)).toBe(true);
      httpCtrl.expectOne(USER_URL);
    });

    it('should open the session list when Sessions is clicked', async () => {
      await visit('/me');
      httpCtrl.expectOne(USER_URL);

      await clickNavItem('Sessions');

      expect(isDisplayed(ListComponent)).toBe(true);
      httpCtrl.expectOne(SESSIONS_URL);
    });

    it('should log the user out and return to the login page when Logout is clicked', async () => {
      await visit('/sessions');
      httpCtrl.expectOne(SESSIONS_URL).flush([]);

      await clickNavItem('Logout');

      expect(isDisplayed(LoginComponent)).toBe(true);
      expect(navItemLabels()).toEqual(['Login', 'Register']);
    });
  });

  async function visit(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
  }

  async function clickNavItem(label: string): Promise<void> {
    const item = navItems().find(
      (navItem) => navItem.nativeElement.textContent.trim() === label,
    ) as DebugElement;

    item.nativeElement.click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function isDisplayed(page: Type<unknown>): boolean {
    return fixture.debugElement.query(By.directive(page)) !== null;
  }

  function navItems(): DebugElement[] {
    return fixture.debugElement.queryAll(By.css('mat-toolbar .link'));
  }

  function navItemLabels(): string[] {
    return navItems().map((item) => item.nativeElement.textContent.trim());
  }
});
