import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { throwError } from 'rxjs';

import { AuthService } from '../../core/service/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const VALID_EMAIL = 'user@test.com';
  const VALID_PASSWORD = 'test!1234';

  let fixture: ComponentFixture<LoginComponent>;
  let loader: HarnessLoader;
  let authService: { login: jest.Mock };

  beforeEach(() => {
    authService = { login: jest.fn() };
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [{ provide: AuthService, useValue: authService }, provideRouter([])],
    });

    fixture = TestBed.createComponent(LoginComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  describe('Submit button', () => {
    for (const [email, password] of [
      ['', VALID_PASSWORD],
      ['not-an-email', VALID_PASSWORD],
      [VALID_EMAIL, ''],
    ]) {
      it(`should stay disabled with the email "${email}" and the password "${password}"`, async () => {
        await fillIn(email, password);

        expect(await (await submitButton()).isDisabled()).toBe(true);
      });
    }

    it('should become active when the email and the password are valid', async () => {
      await fillIn(VALID_EMAIL, VALID_PASSWORD);

      expect(await (await submitButton()).isDisabled()).toBe(false);
    });
  });

  describe('Messages under the fields', () => {
    it('should ask for the email when the field is left empty', async () => {
      await (await emailInput()).blur();

      expect(await (await emailField()).getTextErrors()).toEqual(['This field is required']);
    });

    it('should ask for the correct email when the field is left with a malformed one', async () => {
      const input = await emailInput();
      await input.setValue('not-an-email');
      await input.blur();

      expect(await (await emailField()).getTextErrors()).toEqual([
        'This email address is not valid',
      ]);
    });

    it('should ask for the password when the field is left empty', async () => {
      await (await passwordInput()).blur();

      expect(await (await passwordField()).getTextErrors()).toEqual(['This field is required']);
    });
  });

  describe('Eye button', () => {
    it('should show the password, then hide it again, without sending the form', async () => {
      await fillIn(VALID_EMAIL, VALID_PASSWORD);
      const password = await passwordInput();
      const eye = await loader.getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Hide password"]' }),
      );
      const typeAtStart = await password.getType();

      await eye.click();
      const typeAfterOneClick = await password.getType();
      await eye.click();
      const typeAfterTwoClicks = await password.getType();

      expect([typeAtStart, typeAfterOneClick, typeAfterTwoClicks]).toEqual([
        'password',
        'text',
        'password',
      ]);
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('When the login fails for another reason than the credentials', () => {
    it('should display "An error occurred"', async () => {
      authService.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      await fillIn(VALID_EMAIL, VALID_PASSWORD);

      await (await submitButton()).click();

      expect(serverMessage()).toBe('An error occurred');
    });
  });

  async function fillIn(email: string, password: string): Promise<void> {
    await (await emailInput()).setValue(email);
    await (await passwordInput()).setValue(password);
  }

  function emailInput(): Promise<MatInputHarness> {
    return loader.getHarness(MatInputHarness.with({ selector: '[formControlName="email"]' }));
  }

  function passwordInput(): Promise<MatInputHarness> {
    return loader.getHarness(MatInputHarness.with({ selector: '[formControlName="password"]' }));
  }

  async function emailField(): Promise<MatFormFieldHarness> {
    return (await loader.getAllHarnesses(MatFormFieldHarness))[0];
  }

  async function passwordField(): Promise<MatFormFieldHarness> {
    return (await loader.getAllHarnesses(MatFormFieldHarness))[1];
  }

  function submitButton(): Promise<MatButtonHarness> {
    return loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
  }

  function serverMessage(): string {
    return fixture.nativeElement.querySelector('.error').textContent.trim();
  }
});
