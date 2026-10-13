import user from '../fixtures/login-user.json';
import sessions from '../fixtures/sessions.json';
import teachers from '../fixtures/teachers.json';
import { shouldBeOnTheSessionList } from '../support/checks';

// In the fixtures, the user is enrolled in the second session only.
const [morning, evening] = sessions;
const [margot, helene] = teachers;
const eveningWithNobody = { ...evening, users: [] };

const EVENING_URL = `/api/session/${evening.id}`;
const ENROLMENT_URL = `/api/session/${evening.id}/participate/${user.id}`;

function logInAndServe(role: 'admin' | 'user', eveningSession: object = evening): void {
  cy.intercept('GET', `/api/session/${morning.id}`, morning);
  cy.intercept('GET', EVENING_URL, eveningSession);
  cy.intercept('GET', `/api/teacher/${margot.id}`, margot);
  cy.intercept('GET', `/api/teacher/${helene.id}`, helene);
  cy.login(role);
}

function openDetailOf(name: string): void {
  cy.sessionCard(name).contains('button', 'Detail').click();
}

describe('Session detail', () => {
  describe('Display', () => {
    it('should show the session, its teacher and its dates', () => {
      // A last name in lower case and a later update make the capitals and the two dates visible.
      logInAndServe('user', { ...evening, updatedAt: '2026-10-20T09:00:00' });
      cy.intercept('GET', `/api/teacher/${helene.id}`, { ...helene, lastName: 'Thiercelin' });

      openDetailOf(evening.name);

      cy.contains('h1', 'Evening Stretch');
      cy.contains('Hélène THIERCELIN');
      cy.contains('1 attendees');
      cy.contains('November 2, 2026');
      cy.contains(evening.description);
      cy.contains('Create at: October 13, 2026');
      cy.contains('Last update: October 20, 2026');
    });
  });

  describe('Buttons', () => {
    it('should offer Delete, and no participation, to an admin', () => {
      logInAndServe('admin');

      openDetailOf(evening.name);

      cy.contains('button', 'Delete');
      cy.contains('button', 'Participate').should('not.exist');
      cy.contains('button', 'Do not participate').should('not.exist');
    });

    it('should offer Participate to a user who is not enrolled', () => {
      logInAndServe('user');

      openDetailOf(morning.name);

      cy.contains('button', 'Participate');
      cy.contains('button', 'Do not participate').should('not.exist');
      cy.contains('button', 'Delete').should('not.exist');
    });

    it('should offer "Do not participate" to a user who is enrolled', () => {
      logInAndServe('user');

      openDetailOf(evening.name);

      cy.contains('button', 'Do not participate');
      cy.contains('button', 'Participate').should('not.exist');
      cy.contains('button', 'Delete').should('not.exist');
    });
  });

  describe('Actions', () => {
    it('should enrol the user and show one more attendee when Participate is clicked', () => {
      logInAndServe('user', eveningWithNobody);
      openDetailOf(evening.name);
      cy.contains('0 attendees');
      cy.intercept('POST', ENROLMENT_URL, { statusCode: 200 }).as('enrolment');
      cy.intercept('GET', EVENING_URL, evening);

      cy.contains('button', 'Participate').click();

      cy.wait('@enrolment');
      cy.contains('1 attendees');
      cy.contains('button', 'Do not participate');
    });

    it('should remove the enrolment and show one attendee fewer when "Do not participate" is clicked', () => {
      logInAndServe('user');
      openDetailOf(evening.name);
      cy.contains('1 attendees');
      cy.intercept('DELETE', ENROLMENT_URL, { statusCode: 200 }).as('removal');
      cy.intercept('GET', EVENING_URL, eveningWithNobody);

      cy.contains('button', 'Do not participate').click();

      cy.wait('@removal');
      cy.contains('0 attendees');
      cy.contains('button', 'Participate');
    });

    it('should delete the session, say so and go back to the list when an admin clicks Delete', () => {
      logInAndServe('admin');
      openDetailOf(evening.name);
      cy.intercept('DELETE', EVENING_URL, { statusCode: 200 }).as('deletion');

      cy.contains('button', 'Delete').click();

      cy.wait('@deletion');
      cy.contains('Session deleted !');
      shouldBeOnTheSessionList();
    });
  });

  describe('Failures', () => {
    it('should say that an error occurred when the enrolment fails', () => {
      logInAndServe('user', eveningWithNobody);
      openDetailOf(evening.name);
      cy.intercept('POST', ENROLMENT_URL, { statusCode: 500 });

      cy.contains('button', 'Participate').click();

      cy.contains('An error occurred');
      cy.contains('0 attendees');
    });

    it('should say that an error occurred when the removal of the enrolment fails', () => {
      logInAndServe('user');
      openDetailOf(evening.name);
      cy.intercept('DELETE', ENROLMENT_URL, { statusCode: 500 });

      cy.contains('button', 'Do not participate').click();

      cy.contains('An error occurred');
      cy.contains('1 attendees');
    });

    it('should say that an error occurred, and stay on the page, when the deletion fails', () => {
      logInAndServe('admin');
      openDetailOf(evening.name);
      cy.intercept('DELETE', EVENING_URL, { statusCode: 500 });

      cy.contains('button', 'Delete').click();

      cy.contains('An error occurred');
      cy.location('pathname').should('eq', `/sessions/detail/${evening.id}`);
    });
  });

  describe('Navigation', () => {
    it('should go back to the session list when the back arrow is clicked', () => {
      logInAndServe('user');
      openDetailOf(evening.name);
      cy.contains('h1', 'Evening Stretch');

      cy.contains('button', 'arrow_back').click();

      shouldBeOnTheSessionList();
    });
  });
});
