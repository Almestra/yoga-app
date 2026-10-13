// The API is faked, so the password is never checked.
const ANY_PASSWORD = 'any-password';

Cypress.Commands.add('login', (role, sessions) => {
  cy.intercept('POST', '/api/auth/login', { fixture: `login-${role}.json` }).as('login');
  cy.intercept(
    'GET',
    '/api/session',
    sessions ? { body: sessions } : { fixture: 'sessions.json' },
  ).as('sessions');

  cy.visit('/login');
  cy.fixture(`login-${role}.json`).then((login: { username: string }) => {
    cy.get('input[formControlName=email]').type(login.username);
  });
  cy.get('input[formControlName=password]').type(ANY_PASSWORD);
  cy.contains('button', 'Submit').click();

  cy.contains('Sessions available');
});

Cypress.Commands.add('sessionCard', (name) =>
  cy.contains('mat-card-title', name).closest('mat-card'),
);
