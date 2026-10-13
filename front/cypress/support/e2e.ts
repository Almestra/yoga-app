import '@cypress/code-coverage/support';
import './commands';

// The API sends its dates at midnight UTC and the pages display them in the time zone
// of the browser: in UTC, every machine displays the same day.
before(() => {
  cy.wrap(
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setTimezoneOverride',
      params: { timezoneId: 'UTC' },
    }),
  );
});
