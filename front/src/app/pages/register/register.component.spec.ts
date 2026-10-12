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

import { TEST_REGISTRATION } from '../../../test-data/test-registrations';
import { RegisterRequest } from '../../core/models/registerRequest.interface';
import { AuthService } from '../../core/service/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  const FIELDS_IN_ORDER = ['firstName', 'lastName', 'email', 'password'];

  let fixture: ComponentFixture<RegisterComponent>;
  let loader: HarnessLoader;
  let authService: { register: jest.Mock };

  beforeEach(() => {
    authService = { register: jest.fn() };
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [{ provide: AuthService, useValue: authService }, provideRouter([])],
    });

    fixture = TestBed.createComponent(RegisterComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  describe('Submit button', () => {
    for (const [field, value] of [
      ['firstName', ''],
      ['lastName', ''],
      ['email', ''],
      ['password', ''],
      ['email', 'not-an-email'],
      ['password', '12345'],
    ]) {
      it(`should stay disabled when the ${field} is "${value}"`, async () => {
        await fillIn({ ...TEST_REGISTRATION, [field]: value });

        expect(await (await submitButton()).isDisabled()).toBe(true);
      });
    }

    it('should become active when the four fields are valid', async () => {
      await fillIn(TEST_REGISTRATION);

      expect(await (await submitButton()).isDisabled()).toBe(false);
    });
  });

  describe('Messages under the fields', () => {
    for (const field of FIELDS_IN_ORDER) {
      it(`should ask for the ${field} when the field is left empty`, async () => {
        expect(await messageAfterLeaving(field, '')).toEqual(['This field is required']);
      });
    }

    for (const [field, value, message] of [
      ['email', 'not-an-email', 'This email address is not valid'],
      ['email', `${'a'.repeat(42)}@test.com`, 'At most 50 characters'],
      ['firstName', 'Ja', 'At least 3 characters'],
      ['firstName', 'J'.repeat(21), 'At most 20 characters'],
      ['lastName', 'Do', 'At least 3 characters'],
      ['lastName', 'D'.repeat(21), 'At most 20 characters'],
      ['password', '12345', 'At least 6 characters'],
      ['password', '1'.repeat(41), 'At most 40 characters'],
    ]) {
      it(`should display "${message}" when the ${field} is "${value}"`, async () => {
        expect(await messageAfterLeaving(field, value)).toEqual([message]);
      });
    }
  });

  describe('Password field', () => {
    it('should hide what is typed', async () => {
      expect(await (await inputOf('password')).getType()).toBe('password');
    });
  });

  describe('When the registration fails for another reason than the email', () => {
    it('should display "An error occurred"', async () => {
      authService.register.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 })),
      );
      await fillIn(TEST_REGISTRATION);

      await (await submitButton()).click();

      expect(serverMessage()).toBe('An error occurred');
    });
  });

  async function fillIn(registration: RegisterRequest): Promise<void> {
    await (await inputOf('firstName')).setValue(registration.firstName);
    await (await inputOf('lastName')).setValue(registration.lastName);
    await (await inputOf('email')).setValue(registration.email);
    await (await inputOf('password')).setValue(registration.password);
  }

  async function messageAfterLeaving(field: string, value: string): Promise<string[]> {
    const input = await inputOf(field);
    await input.setValue(value);
    await input.blur();

    return (await fieldOf(field)).getTextErrors();
  }

  function inputOf(field: string): Promise<MatInputHarness> {
    return loader.getHarness(MatInputHarness.with({ selector: `[formControlName="${field}"]` }));
  }

  async function fieldOf(field: string): Promise<MatFormFieldHarness> {
    return (await loader.getAllHarnesses(MatFormFieldHarness))[FIELDS_IN_ORDER.indexOf(field)];
  }

  function submitButton(): Promise<MatButtonHarness> {
    return loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
  }

  function serverMessage(): string {
    return fixture.nativeElement.querySelector('.error').textContent.trim();
  }
});
