import adminAccount from '../fixtures/account-admin.json';
import userAccount from '../fixtures/account-user.json';
import {
  shouldBeOnTheLoginPage,
  shouldBeOnTheSessionList,
  toolbarShouldOffer,
} from '../support/checks';

const ACCOUNT_URL = `/api/user/${userAccount.id}`;

function openAccountAs(role: 'admin' | 'user', served?: object): void {
  const account = role === 'admin' ? adminAccount : userAccount;
  cy.intercept('GET', `/api/user/${account.id}`, served ?? account);
  cy.login(role);
  cy.get('mat-toolbar').contains('Account').click();
  cy.contains('h1', 'User information');
}

describe('Account', () => {
  describe('Display', () => {
    it('should show the name, the email and the dates of the user', () => {
      // A later update makes the two dates visible.
      openAccountAs('user', { ...userAccount, updatedAt: '2026-10-20T09:00:00' });

      cy.contains('Name: Jane DOE');
      cy.contains(`Email: ${userAccount.email}`);
      cy.contains('Create at: October 13, 2026');
      cy.contains('Last update: October 20, 2026');
    });

    it('should tell an admin that they are admin, and offer no deletion', () => {
      openAccountAs('admin');

      cy.contains('You are admin');
      cy.contains('Delete my account:').should('not.exist');
      cy.contains('button', 'Delete').should('not.exist');
    });

    it('should offer the deletion of the account to a user who is not an admin', () => {
      openAccountAs('user');

      cy.contains('Delete my account:');
      cy.contains('button', 'Delete');
      cy.contains('You are admin').should('not.exist');
    });
  });

  describe('Deletion', () => {
    it('should delete the account, say so and log the user out when Delete is clicked', () => {
      openAccountAs('user');
      cy.intercept('DELETE', ACCOUNT_URL, { statusCode: 200 }).as('deletion');

      cy.contains('button', 'Delete').click();

      cy.wait('@deletion');
      cy.contains('Your account has been deleted !');
      shouldBeOnTheLoginPage();
      toolbarShouldOffer('Login', 'Register');
    });

    it('should say that an error occurred, and keep the user logged in, when the deletion fails', () => {
      openAccountAs('user');
      cy.intercept('DELETE', ACCOUNT_URL, { statusCode: 500 });

      cy.contains('button', 'Delete').click();

      cy.contains('An error occurred');
      cy.location('pathname').should('eq', '/me');
      toolbarShouldOffer('Sessions', 'Account', 'Logout');
    });
  });

  describe('Navigation', () => {
    it('should go back to the session list when the back arrow is clicked', () => {
      openAccountAs('user');

      cy.contains('button', 'arrow_back').click();

      shouldBeOnTheSessionList();
    });
  });
});
