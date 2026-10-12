import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { of } from 'rxjs';

import { TEST_ADMIN_LOGIN, TEST_USER_LOGIN } from '../../../../../test-data/test-logins';
import { TEST_SESSIONS } from '../../../../../test-data/test-sessions';
import { Session } from '../../../../core/models/session.interface';
import { SessionInformation } from '../../../../core/models/sessionInformation.interface';
import { SessionService } from '../../../../core/service/session.service';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { ListComponent } from './list.component';

describe('ListComponent', () => {
  let fixture: ComponentFixture<ListComponent>;
  let loader: HarnessLoader;
  let sessionApiService: { all: jest.Mock };

  beforeEach(() => {
    sessionApiService = { all: jest.fn() };
    TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [{ provide: SessionApiService, useValue: sessionApiService }, provideRouter([])],
    });
  });

  describe('Sessions', () => {
    it('should display the name, the date and the description of each session', () => {
      display(TEST_SESSIONS, TEST_USER_LOGIN);

      expect(cards()).toEqual([
        {
          name: 'Morning flow',
          date: 'Session on October 15, 2026',
          description: 'A gentle start of the day',
        },
        {
          name: 'Evening stretch',
          date: 'Session on November 2, 2026',
          description: 'Slow postures to end the day',
        },
      ]);
    });

    it('should display no card when there is no session', () => {
      display([], TEST_USER_LOGIN);

      expect(cards()).toEqual([]);
    });
  });

  describe('Buttons', () => {
    it('should offer Detail on each session, but neither Create nor Edit, to a user', async () => {
      display(TEST_SESSIONS, TEST_USER_LOGIN);

      expect(await buttonCounts()).toEqual({ create: 0, detail: 2, edit: 0 });
    });

    it('should offer Create, and Detail and Edit on each session, to an admin', async () => {
      display(TEST_SESSIONS, TEST_ADMIN_LOGIN);

      expect(await buttonCounts()).toEqual({ create: 1, detail: 2, edit: 2 });
    });
  });

  function display(sessions: Session[], login: SessionInformation): void {
    sessionApiService.all.mockReturnValue(of(sessions));
    TestBed.inject(SessionService).logIn(login);
    fixture = TestBed.createComponent(ListComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  }

  function cards(): { name: string; date: string; description: string }[] {
    return fixture.debugElement.queryAll(By.css('.item')).map((card) => ({
      name: textOf(card.nativeElement, 'mat-card-title'),
      date: textOf(card.nativeElement, 'mat-card-subtitle'),
      description: textOf(card.nativeElement, 'mat-card-content p'),
    }));
  }

  function textOf(card: HTMLElement, selector: string): string {
    return card.querySelector(selector)?.textContent?.trim() ?? '';
  }

  async function buttonCounts(): Promise<{ create: number; detail: number; edit: number }> {
    return {
      create: (await buttons('Create')).length,
      detail: (await buttons('Detail')).length,
      edit: (await buttons('Edit')).length,
    };
  }

  function buttons(label: string): Promise<MatButtonHarness[]> {
    return loader.getAllHarnesses(MatButtonHarness.with({ text: new RegExp(`${label}$`) }));
  }
});
