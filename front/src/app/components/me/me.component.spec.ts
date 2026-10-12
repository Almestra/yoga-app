import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { of } from 'rxjs';

import { TEST_USER_LOGIN } from '../../../test-data/test-logins';
import { TEST_USERS } from '../../../test-data/test-users';
import { SessionService } from '../../core/service/session.service';
import { UserService } from '../../core/service/user.service';
import { MeComponent } from './me.component';

describe('MeComponent', () => {
  let fixture: ComponentFixture<MeComponent>;
  let userService: { getById: jest.Mock };

  beforeEach(() => {
    userService = { getById: jest.fn().mockReturnValue(of(TEST_USERS[1])) };
    TestBed.configureTestingModule({
      imports: [MeComponent],
      providers: [{ provide: UserService, useValue: userService }, provideRouter([])],
    });
    TestBed.inject(SessionService).logIn(TEST_USER_LOGIN);

    fixture = TestBed.createComponent(MeComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display the name, the email and the dates of the user', () => {
    expect({
      name: textOf('mat-card-content p:nth-child(1)'),
      email: textOf('mat-card-content p:nth-child(2)'),
      created: textOf('.w100 p:first-child'),
      updated: textOf('.w100 p:last-child'),
    }).toEqual({
      name: 'Name: User TEST',
      email: 'Email: user@test.com',
      created: 'Create at: September 7, 2026',
      updated: 'Last update: September 8, 2026',
    });
  });

  it('should ask the browser to go back to the previous page when the arrow is clicked', async () => {
    const back = jest.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    await (await loader.getHarness(MatButtonHarness.with({ text: 'arrow_back' }))).click();

    expect(back).toHaveBeenCalled();
  });

  function textOf(selector: string): string {
    const element: HTMLElement = fixture.nativeElement.querySelector(selector);

    return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
});
