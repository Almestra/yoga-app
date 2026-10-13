const RESERVED_PAGES = [
  '/sessions',
  '/sessions/detail/1',
  '/sessions/create',
  '/sessions/update/1',
  '/me',
];

function toolbarShouldOffer(...labels: string[]): void {
  cy.get('mat-toolbar').should('have.text', ['Yoga app', ...labels].join(''));
}

function shouldBeOnTheLoginPage(): void {
  cy.location('pathname').should('eq', '/login');
  cy.contains('mat-card-title', 'Login');
}

function shouldBeOnTheSessionList(): void {
  cy.location('pathname').should('eq', '/sessions');
  cy.contains('Sessions available');
}

describe('Application frame', () => {
  describe('When nobody is logged in', () => {
    it('should open on the login page and offer Login and Register only', () => {
      cy.visit('/');

      shouldBeOnTheLoginPage();
      toolbarShouldOffer('Login', 'Register');
    });

    it('should lead to the register page, then back to the login page, from the toolbar', () => {
      cy.visit('/');

      cy.get('mat-toolbar').contains('Register').click();
      cy.location('pathname').should('eq', '/register');
      cy.contains('mat-card-title', 'Register');

      cy.get('mat-toolbar').contains('Login').click();
      shouldBeOnTheLoginPage();
    });

    for (const url of RESERVED_PAGES) {
      it(`should send to the login page a visitor who types the address ${url}`, () => {
        cy.visit(url);

        shouldBeOnTheLoginPage();
      });
    }

    it('should display "Page not found !" for an unknown address', () => {
      cy.visit('/unknown-page');

      cy.contains('Page not found !');
    });
  });

  describe('When a user is logged in', () => {
    beforeEach(() => {
      cy.login('user');
    });

    it('should offer Sessions, Account and Logout only', () => {
      toolbarShouldOffer('Sessions', 'Account', 'Logout');
    });

    it('should lead to the account page, then back to the session list, from the toolbar', () => {
      cy.intercept('GET', '/api/user/*', { fixture: 'account-user.json' });

      cy.get('mat-toolbar').contains('Account').click();
      cy.location('pathname').should('eq', '/me');
      cy.contains('User information');

      cy.get('mat-toolbar').contains('Sessions').click();
      shouldBeOnTheSessionList();
    });

    it('should log the user out when Logout is clicked', () => {
      cy.get('mat-toolbar').contains('Logout').click();

      shouldBeOnTheLoginPage();
      toolbarShouldOffer('Login', 'Register');
    });

    it('should not reopen the session list through the browser history after a logout', () => {
      cy.get('mat-toolbar').contains('Logout').click();
      cy.get('mat-toolbar').contains('Register').click();
      cy.contains('mat-card-title', 'Register');

      // Two steps back, from another page: the check cannot pass before the navigation.
      cy.go(-2);

      shouldBeOnTheLoginPage();
    });

    it('should log the user out when Enter is pressed on Logout', () => {
      cy.get('mat-toolbar').contains('Logout').focus().trigger('keydown', { key: 'Enter' });

      shouldBeOnTheLoginPage();
      toolbarShouldOffer('Login', 'Register');
    });

    it('should log the user out when the page is reloaded', () => {
      cy.reload();

      shouldBeOnTheLoginPage();
      toolbarShouldOffer('Login', 'Register');
    });

    it('should send back to the session list a user who returns to the login page through the browser history', () => {
      cy.intercept('GET', '/api/user/*', { fixture: 'account-user.json' });
      cy.get('mat-toolbar').contains('Account').click();
      cy.contains('User information');

      // Two steps back, from another page: the check cannot pass before the navigation.
      cy.go(-2);

      shouldBeOnTheSessionList();
    });

    it('should send the token with the requests that follow the login, not with the login itself', () => {
      cy.wait('@login').its('request.headers').should('not.have.property', 'authorization');

      cy.fixture('login-user.json').then((login: { token: string }) => {
        cy.wait('@sessions')
          .its('request.headers.authorization')
          .should('eq', `Bearer ${login.token}`);
      });
    });
  });
});
