export function toolbarShouldOffer(...labels: string[]): void {
  cy.get('mat-toolbar').should('have.text', ['Yoga app', ...labels].join(''));
}

export function shouldBeOnTheLoginPage(): void {
  cy.location('pathname').should('eq', '/login');
  cy.contains('mat-card-title', 'Login');
}

export function shouldBeOnTheSessionList(): void {
  cy.location('pathname').should('eq', '/sessions');
  cy.contains('Sessions available');
}
