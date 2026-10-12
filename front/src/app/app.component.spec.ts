import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { expect } from '@jest/globals';

import { TEST_USER_LOGIN } from '../test-data/test-logins';
import { AppComponent } from './app.component';
import { SessionService } from './core/service/session.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(AppComponent);
  });

  describe('When nobody is logged in', () => {
    it('should offer Login and Register only', () => {
      fixture.detectChanges();

      expect(navItemLabels()).toEqual(['Login', 'Register']);
    });
  });

  describe('When a user is logged in', () => {
    beforeEach(() => {
      TestBed.inject(SessionService).logIn(TEST_USER_LOGIN);
      fixture.detectChanges();
    });

    it('should offer Sessions, Account and Logout only', () => {
      expect(navItemLabels()).toEqual(['Sessions', 'Account', 'Logout']);
    });

    it('should log the user out when Enter is pressed on Logout', () => {
      const logout = navItems().find(
        (item) => item.nativeElement.textContent.trim() === 'Logout',
      ) as DebugElement;

      logout.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();

      expect(navItemLabels()).toEqual(['Login', 'Register']);
    });
  });

  function navItems(): DebugElement[] {
    return fixture.debugElement.queryAll(By.css('mat-toolbar .link'));
  }

  function navItemLabels(): string[] {
    return navItems().map((item) => item.nativeElement.textContent.trim());
  }
});
