import sessions from '../fixtures/sessions.json';
import teachers from '../fixtures/teachers.json';

const [morning, evening] = sessions;

function sessionCard(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.contains('mat-card-title', name).closest('mat-card');
}

function buttons(label: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`button:contains("${label}")`);
}

describe('Session list', () => {
  describe('Display', () => {
    it('should show the name, the date and the description of each session', () => {
      cy.login('user');

      sessionCard(morning.name)
        .should('contain', 'Session on October 15, 2026')
        .and('contain', morning.description);
      sessionCard(evening.name)
        .should('contain', 'Session on November 2, 2026')
        .and('contain', evening.description);
      buttons('Detail').should('have.length', 2);
    });

    it('should show no session when the server sends none', () => {
      cy.login('user', []);
      cy.wait('@sessions');

      buttons('Detail').should('not.exist');
    });
  });

  describe('Buttons', () => {
    it('should offer Detail on each session, and neither Create nor Edit, to a user who is not an admin', () => {
      cy.login('user');

      buttons('Detail').should('have.length', 2);
      buttons('Create').should('not.exist');
      buttons('Edit').should('not.exist');
    });

    it('should offer Create, and Detail and Edit on each session, to an admin', () => {
      cy.login('admin');

      buttons('Create').should('have.length', 1);
      buttons('Detail').should('have.length', 2);
      buttons('Edit').should('have.length', 2);
    });
  });

  describe('Ways out', () => {
    it('should open the detail of the session whose Detail button is clicked', () => {
      cy.intercept('GET', `/api/session/${evening.id}`, evening);
      cy.intercept('GET', `/api/teacher/${evening.teacher_id}`, teachers[1]);
      cy.login('user');

      sessionCard(evening.name).contains('button', 'Detail').click();

      cy.location('pathname').should('eq', `/sessions/detail/${evening.id}`);
      cy.contains('h1', 'Evening Stretch');
    });

    it('should open the creation form when an admin clicks Create', () => {
      cy.intercept('GET', '/api/teacher', teachers);
      cy.login('admin');

      cy.contains('button', 'Create').click();

      cy.location('pathname').should('eq', '/sessions/create');
      cy.contains('h1', 'Create session');
    });

    it('should open the update form of the session whose Edit button is clicked', () => {
      cy.intercept('GET', `/api/session/${evening.id}`, evening);
      cy.intercept('GET', '/api/teacher', teachers);
      cy.login('admin');

      sessionCard(evening.name).contains('button', 'Edit').click();

      cy.location('pathname').should('eq', `/sessions/update/${evening.id}`);
      cy.contains('h1', 'Update session');
      cy.get('input[formControlName=name]').should('have.value', evening.name);
    });
  });
});
