declare namespace Cypress {
  interface Chainable {
    /**
     * Logs in through the login form, with the answers of the API faked,
     * and ends on the session list.
     */
    login(role: 'admin' | 'user'): Chainable<void>;
  }
}
