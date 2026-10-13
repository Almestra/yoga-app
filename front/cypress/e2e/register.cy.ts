import { shouldBeOnTheLoginPage } from '../support/checks';

const REGISTRATION = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@test.com',
  password: 'any-password',
};

type Field = keyof typeof REGISTRATION;

const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'password'];

const LABELS: Record<Field, string> = {
  firstName: 'first name',
  lastName: 'last name',
  email: 'email',
  password: 'password',
};

const REFUSED_VALUES: { field: Field; value: string; message: string; title: string }[] = [
  {
    field: 'firstName',
    value: 'Ja',
    message: 'At least 3 characters',
    title: 'a first name of 2 characters',
  },
  {
    field: 'firstName',
    value: 'J'.repeat(21),
    message: 'At most 20 characters',
    title: 'a first name of 21 characters',
  },
  {
    field: 'lastName',
    value: 'Do',
    message: 'At least 3 characters',
    title: 'a last name of 2 characters',
  },
  {
    field: 'lastName',
    value: 'D'.repeat(21),
    message: 'At most 20 characters',
    title: 'a last name of 21 characters',
  },
  {
    field: 'email',
    value: 'jane.doe',
    message: 'This email address is not valid',
    title: 'a malformed email',
  },
  {
    field: 'email',
    value: `${'j'.repeat(42)}@test.com`,
    message: 'At most 50 characters',
    title: 'an email of 51 characters',
  },
  {
    field: 'password',
    value: '12345',
    message: 'At least 6 characters',
    title: 'a password of 5 characters',
  },
  {
    field: 'password',
    value: 'p'.repeat(41),
    message: 'At most 40 characters',
    title: 'a password of 41 characters',
  },
];

function field(name: Field): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`input[formControlName=${name}]`);
}

function submitButton(): Cypress.Chainable<JQuery<HTMLButtonElement>> {
  return cy.contains('button', 'Submit');
}

function fillIn(names: Field[]): void {
  for (const name of names) {
    field(name).type(REGISTRATION[name]);
  }
}

function acceptTheRegistration(): void {
  cy.intercept('POST', '/api/auth/register', {
    body: { message: 'User registered successfully!' },
  }).as('register');
}

function shouldBeOnTheRegisterPage(): void {
  cy.location('pathname').should('eq', '/register');
  cy.contains('mat-card-title', 'Register');
}

describe('Registration', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  describe('Form', () => {
    it('should keep Submit disabled until the four fields are valid', () => {
      submitButton().should('be.disabled');

      fillIn(FIELDS);
      submitButton().should('be.enabled');

      for (const name of FIELDS) {
        field(name).clear();
        submitButton().should('be.disabled');
        field(name).type(REGISTRATION[name]);
        submitButton().should('be.enabled');
      }

      field('email').clear().type('jane.doe');
      submitButton().should('be.disabled');
    });

    for (const name of FIELDS) {
      it(`should ask for the ${LABELS[name]} when the field is left empty`, () => {
        field(name).focus().blur();

        cy.contains('This field is required');
      });
    }

    for (const { field: name, value, message, title } of REFUSED_VALUES) {
      it(`should say "${message}" for ${title}`, () => {
        field(name).type(value).blur();

        cy.contains(message);
      });
    }

    it('should mask the password', () => {
      field('password').type(REGISTRATION.password);

      field('password').should('have.attr', 'type', 'password');
    });
  });

  describe('Answer of the server', () => {
    it('should send the four values, then open the login page, when the registration is accepted', () => {
      acceptTheRegistration();

      fillIn(FIELDS);
      submitButton().click();

      cy.wait('@register').its('request.body').should('deep.equal', REGISTRATION);
      shouldBeOnTheLoginPage();
    });

    it('should say that the email is already used when the server refuses it', () => {
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 400,
        body: { message: 'Error: Email is already taken!' },
      });

      fillIn(FIELDS);
      submitButton().click();

      cy.contains('This email is already used');
      shouldBeOnTheRegisterPage();
    });

    it('should say that an error occurred when the registration fails for another reason', () => {
      cy.intercept('POST', '/api/auth/register', { statusCode: 500 });

      fillIn(FIELDS);
      submitButton().click();

      cy.contains('An error occurred');
    });
  });

  describe('Keyboard', () => {
    it('should submit the form when Enter is pressed in a field', () => {
      acceptTheRegistration();

      fillIn(['firstName', 'lastName', 'email']);
      field('password').type(`${REGISTRATION.password}{enter}`);

      shouldBeOnTheLoginPage();
    });

    it('should send nothing when Enter is pressed in an incomplete form', () => {
      acceptTheRegistration();

      fillIn(['firstName', 'lastName']);
      field('email').type(`${REGISTRATION.email}{enter}`);
      fillIn(['password']);
      submitButton().click();

      shouldBeOnTheLoginPage();
      cy.get('@register.all').should('have.length', 1);
    });
  });
});
