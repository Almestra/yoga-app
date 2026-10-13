import user from '../fixtures/login-user.json';
import sessions from '../fixtures/sessions.json';
import teachers from '../fixtures/teachers.json';
import { shouldBeOnTheSessionList } from '../support/checks';

const [, evening] = sessions;
const [margot, helene] = teachers;

const NEW_SESSION = {
  name: 'Sunday relax',
  date: '2026-12-06',
  description: 'A quiet hour to end the week',
};
const NEW_DESCRIPTION = 'Slow postures and breathing to end the day';

const EVENING_URL = `/api/session/${evening.id}`;

function nameOf(teacher: { firstName: string; lastName: string }): string {
  return `${teacher.firstName} ${teacher.lastName}`;
}

function nameField(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('input[formControlName=name]');
}

function dateField(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('input[formControlName=date]');
}

function teacherSelect(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('mat-select[formControlName=teacher_id]');
}

function descriptionField(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('textarea[formControlName=description]');
}

function saveButton(): Cypress.Chainable<JQuery<HTMLButtonElement>> {
  return cy.contains('button', 'Save');
}

function chooseTeacher(teacher: { firstName: string; lastName: string }): void {
  teacherSelect().click();
  cy.contains('mat-option', nameOf(teacher)).click();
}

function fillInTheNewSession(): void {
  nameField().type(NEW_SESSION.name);
  dateField().type(NEW_SESSION.date);
  descriptionField().type(NEW_SESSION.description);
  chooseTeacher(margot);
}

function openCreationForm(): void {
  cy.intercept('GET', '/api/teacher', teachers);
  cy.login('admin');
  cy.contains('button', 'Create').click();
  cy.contains('h1', 'Create session');
}

function openUpdateForm(): void {
  cy.intercept('GET', '/api/teacher', teachers);
  cy.intercept('GET', EVENING_URL, evening);
  cy.login('admin');
  cy.sessionCard(evening.name).contains('button', 'Edit').click();
  cy.contains('h1', 'Update session');
}

describe('Session form', () => {
  describe('Creation form', () => {
    beforeEach(() => {
      openCreationForm();
    });

    it('should open empty, and keep Save disabled until the four fields are filled', () => {
      nameField().should('have.value', '');
      dateField().should('have.value', '');
      descriptionField().should('have.value', '');
      saveButton().should('be.disabled');

      nameField().type(NEW_SESSION.name);
      dateField().type(NEW_SESSION.date);
      descriptionField().type(NEW_SESSION.description);
      saveButton().should('be.disabled');

      chooseTeacher(margot);
      saveButton().should('be.enabled');

      for (const [field, value] of [
        [nameField, NEW_SESSION.name],
        [dateField, NEW_SESSION.date],
        [descriptionField, NEW_SESSION.description],
      ] as const) {
        field().clear();
        saveButton().should('be.disabled');
        field().type(value);
        saveButton().should('be.enabled');
      }
    });

    it('should offer every teacher sent by the server', () => {
      teacherSelect().click();

      cy.get('mat-option').should('have.length', 2);
      cy.contains('mat-option', nameOf(margot));
      cy.contains('mat-option', nameOf(helene));
    });

    for (const [label, field] of [
      ['name', nameField],
      ['date', dateField],
      ['teacher', teacherSelect],
      ['description', descriptionField],
    ] as const) {
      it(`should ask for the ${label} when the field is left empty`, () => {
        field().focus().blur();

        cy.contains('This field is required');
      });
    }

    it('should say "At most 50 characters" for a name of 51 characters', () => {
      nameField().type('n'.repeat(51)).blur();

      cy.contains('At most 50 characters');
    });

    it('should say "At most 2500 characters" for a description of 2501 characters', () => {
      descriptionField().type('d'.repeat(2501), { delay: 0 }).blur();

      cy.contains('At most 2500 characters');
    });

    it('should send the four values, say so and go back to the list when the creation is accepted', () => {
      cy.intercept('POST', '/api/session', evening).as('creation');
      fillInTheNewSession();

      saveButton().click();

      cy.wait('@creation')
        .its('request.body')
        .should('deep.equal', { ...NEW_SESSION, teacher_id: margot.id });
      cy.contains('Session created !');
      shouldBeOnTheSessionList();
    });

    it('should say that an error occurred, and stay on the form, when the creation fails', () => {
      cy.intercept('POST', '/api/session', { statusCode: 500 });
      fillInTheNewSession();

      saveButton().click();

      cy.contains('An error occurred');
      cy.location('pathname').should('eq', '/sessions/create');
    });

    it('should go back to the session list when the back arrow is clicked', () => {
      cy.contains('button', 'arrow_back').click();

      shouldBeOnTheSessionList();
    });
  });

  describe('Update form', () => {
    beforeEach(() => {
      openUpdateForm();
    });

    it('should open with the current values of the session', () => {
      nameField().should('have.value', evening.name);
      dateField().should('have.value', '2026-11-02');
      teacherSelect().should('contain', nameOf(helene));
      descriptionField().should('have.value', evening.description);
    });

    it('should send the values for that session, say so and go back to the list when the update is accepted', () => {
      cy.intercept('PUT', EVENING_URL, evening).as('update');
      descriptionField().clear().type(NEW_DESCRIPTION);

      saveButton().click();

      cy.wait('@update').its('request.body').should('deep.equal', {
        name: evening.name,
        date: '2026-11-02',
        teacher_id: evening.teacher_id,
        description: NEW_DESCRIPTION,
      });
      cy.contains('Session updated !');
      shouldBeOnTheSessionList();
    });

    it('should say that an error occurred, and stay on the form, when the update fails', () => {
      cy.intercept('PUT', EVENING_URL, { statusCode: 500 });
      descriptionField().clear().type(NEW_DESCRIPTION);

      saveButton().click();

      cy.contains('An error occurred');
      cy.location('pathname').should('eq', `/sessions/update/${evening.id}`);
    });
  });

  describe('Access', () => {
    it('should send back to the list a user who is not an admin and reaches the form through the browser history', () => {
      // An admin leaves the creation form in the history of the tab, then logs out.
      openCreationForm();
      cy.get('mat-toolbar').contains('Logout').click();

      // Another user logs in on the same tab, without reloading the page.
      cy.intercept('POST', '/api/auth/login', { fixture: 'login-user.json' });
      cy.intercept('GET', '/api/user/*', { fixture: 'account-user.json' });
      cy.get('input[formControlName=email]').type(user.username);
      cy.get('input[formControlName=password]').type('any-password');
      cy.contains('button', 'Submit').click();
      cy.get('mat-toolbar').contains('Account').click();
      cy.contains('User information');

      // Three steps back, from another page: the check cannot pass before the navigation.
      cy.go(-3);

      shouldBeOnTheSessionList();
    });
  });
});
