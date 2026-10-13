declare namespace Cypress {
  interface Chainable {
    /**
     * Logs in through the login form, with the answers of the API faked,
     * and ends on the session list. The list holds the sessions of the
     * fixture, unless others are given.
     */
    login(role: 'admin' | 'user', sessions?: object[]): Chainable<void>;

    /** Finds, on the session list, the card of the session with that name. */
    sessionCard(name: string): Chainable<JQuery<HTMLElement>>;
  }
}
