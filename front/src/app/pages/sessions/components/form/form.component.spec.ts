import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { of, Subject } from 'rxjs';

import { TEST_ADMIN_LOGIN } from '../../../../../test-data/test-logins';
import { TEST_SESSION_ENTRY } from '../../../../../test-data/test-sessions';
import { TEST_TEACHERS } from '../../../../../test-data/test-teachers';
import { Session } from '../../../../core/models/session.interface';
import { SessionService } from '../../../../core/service/session.service';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { FormComponent } from './form.component';

describe('FormComponent', () => {
  const FIELDS_IN_ORDER = ['name', 'date', 'teacher', 'description'];

  let fixture: ComponentFixture<FormComponent>;
  let loader: HarnessLoader;
  let sessionApiService: { create: jest.Mock };
  let teacherService: { all: jest.Mock };

  beforeEach(() => {
    sessionApiService = { create: jest.fn() };
    teacherService = { all: jest.fn().mockReturnValue(of(TEST_TEACHERS)) };
    TestBed.configureTestingModule({
      imports: [FormComponent],
      providers: [
        { provide: SessionApiService, useValue: sessionApiService },
        { provide: TeacherService, useValue: teacherService },
        provideRouter([]),
      ],
    });
    TestBed.inject(SessionService).logIn(TEST_ADMIN_LOGIN);

    fixture = TestBed.createComponent(FormComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  describe('When the form opens', () => {
    it('should be titled "Create session" and be empty', async () => {
      expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Create session');
      expect({
        name: await (await inputOf('name')).getValue(),
        date: await (await inputOf('date')).getValue(),
        teacher: await (await teacherSelect()).getValueText(),
        description: await (await inputOf('description')).getValue(),
      }).toEqual({ name: '', date: '', teacher: '', description: '' });
    });
  });

  describe('Save button', () => {
    it('should be disabled while the form is empty', async () => {
      expect(await (await saveButton()).isDisabled()).toBe(true);
    });

    for (const missing of FIELDS_IN_ORDER) {
      it(`should stay disabled when only the ${missing} is missing`, async () => {
        await fillIn({ ...TEST_SESSION_ENTRY, [missing]: undefined });

        expect(await (await saveButton()).isDisabled()).toBe(true);
      });
    }

    it('should become active when the four fields are filled', async () => {
      await fillIn(TEST_SESSION_ENTRY);

      expect(await (await saveButton()).isDisabled()).toBe(false);
    });
  });

  describe('Teacher list', () => {
    it('should offer every teacher sent by the server', async () => {
      const select = await teacherSelect();
      await select.open();
      const options = await select.getOptions();

      expect(await Promise.all(options.map((option) => option.getText()))).toEqual([
        'Margot Delahaye',
        'Hélène Thiercelin',
      ]);
    });
  });

  describe('Messages under the fields', () => {
    for (const field of ['name', 'date', 'description']) {
      it(`should ask for the ${field} when the field is left empty`, async () => {
        expect(await messageAfterLeaving(field, '')).toEqual(['This field is required']);
      });
    }

    it('should ask for the teacher when the list is closed without a choice', async () => {
      const select = await teacherSelect();
      await select.open();
      await select.close();

      expect(await (await fieldOf('teacher')).getTextErrors()).toEqual(['This field is required']);
    });

    for (const [field, value, message] of [
      ['name', 'a'.repeat(51), 'At most 50 characters'],
      ['description', 'a'.repeat(2501), 'At most 2500 characters'],
    ]) {
      it(`should display "${message}" when the ${field} has ${value.length} characters`, async () => {
        expect(await messageAfterLeaving(field, value)).toEqual([message]);
      });
    }
  });

  describe('When the creation fails', () => {
    it('should display "An error occurred"', async () => {
      const answer = new Subject<Session>();
      sessionApiService.create.mockReturnValue(answer);
      await fillIn(TEST_SESSION_ENTRY);

      await (await saveButton()).click();
      answer.error(new HttpErrorResponse({ status: 500 }));

      expect(await notification()).toBe('An error occurred');
    });
  });

  async function fillIn(entry: Partial<typeof TEST_SESSION_ENTRY>): Promise<void> {
    if (entry.name !== undefined) {
      await (await inputOf('name')).setValue(entry.name);
    }
    if (entry.date !== undefined) {
      await (await inputOf('date')).setValue(entry.date);
    }
    if (entry.teacher !== undefined) {
      await (await teacherSelect()).clickOptions({ text: entry.teacher });
    }
    if (entry.description !== undefined) {
      await (await inputOf('description')).setValue(entry.description);
    }
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

  function teacherSelect(): Promise<MatSelectHarness> {
    return loader.getHarness(MatSelectHarness);
  }

  async function fieldOf(field: string): Promise<MatFormFieldHarness> {
    return (await loader.getAllHarnesses(MatFormFieldHarness))[FIELDS_IN_ORDER.indexOf(field)];
  }

  function saveButton(): Promise<MatButtonHarness> {
    return loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
  }

  async function notification(): Promise<string> {
    const snackBar =
      await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(MatSnackBarHarness);

    return snackBar.getMessage();
  }
});
