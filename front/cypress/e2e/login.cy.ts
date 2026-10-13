import { shouldBeOnTheLoginPage, shouldBeOnTheSessionList } from '../support/checks';

const EMAIL = 'jane.doe@test.com';
const PASSWORD = 'any-password';

function emailField(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('input[formControlName=email]');
}

function passwordField(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('input[formControlName=password]');
}

function submitButton(): Cypress.Chainable<JQuery<HTMLButtonElement>> {
  return cy.contains('button', 'Submit');
}

function eyeButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('button[aria-label="Hide password"]');
}

function acceptTheLogin(): void {
  cy.intercept('POST', '/api/auth/login', { fixture: 'login-user.json' }).as('login');
  cy.intercept('GET', '/api/session', { fixture: 'sessions.json' });
}

describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Form', () => {
    it('should keep Submit disabled until the email and the password are valid', () => {
      submitButton().should('be.disabled');

      passwordField().type(PASSWORD);
      submitButton().should('be.disabled');

      emailField().type('jane.doe');
      submitButton().should('be.disabled');

      emailField().clear().type(EMAIL);
      submitButton().should('be.enabled');

      passwordField().clear();
      submitButton().should('be.disabled');
    });

    it('should ask for the email when the field is left empty', () => {
      emailField().focus().blur();

      cy.contains('This field is required');
    });

    it('should ask for a valid email when the field is left with a malformed one', () => {
      emailField().type('jane.doe').blur();

      cy.contains('This email address is not valid');
    });

    it('should ask for the password when the field is left empty', () => {
      passwordField().focus().blur();

      cy.contains('This field is required');
    });

    it('should show the password, then hide it again, without sending anything', () => {
      acceptTheLogin();
      emailField().type(EMAIL);
      passwordField().type(PASSWORD);
      passwordField().should('have.attr', 'type', 'password');

      eyeButton().click();
      passwordField().should('have.attr', 'type', 'text');

      eyeButton().click();
      passwordField().should('have.attr', 'type', 'password');
      cy.get('@login.all').should('have.length', 0);
    });
  });

  describe('Answer of the server', () => {
    it('should send the email and the password, then open the session list, when the login is accepted', () => {
      acceptTheLogin();

      emailField().type(EMAIL);
      passwordField().type(PASSWORD);
      submitButton().click();

      cy.wait('@login')
        .its('request.body')
        .should('deep.equal', { email: EMAIL, password: PASSWORD });
      shouldBeOnTheSessionList();
    });

    it('should say that the email or the password is incorrect when the login is refused', () => {
      cy.intercept('POST', '/api/auth/login', { statusCode: 401 });

      emailField().type(EMAIL);
      passwordField().type(PASSWORD);
      submitButton().click();

      cy.contains('Incorrect email or password');
      shouldBeOnTheLoginPage();
    });

    it('should say that an error occurred when the login fails for another reason', () => {
      cy.intercept('POST', '/api/auth/login', { statusCode: 500 });

      emailField().type(EMAIL);
      passwordField().type(PASSWORD);
      submitButton().click();

      cy.contains('An error occurred');
    });
  });

  describe('Keyboard', () => {
    it('should submit the form when Enter is pressed in a field', () => {
      acceptTheLogin();

      emailField().type(EMAIL);
      passwordField().type(`${PASSWORD}{enter}`);

      shouldBeOnTheSessionList();
    });

    it('should send nothing when Enter is pressed in an incomplete form', () => {
      acceptTheLogin();

      emailField().type(`${EMAIL}{enter}`);
      passwordField().type(PASSWORD);
      submitButton().click();

      shouldBeOnTheSessionList();
      cy.get('@login.all').should('have.length', 1);
    });
  });
});
