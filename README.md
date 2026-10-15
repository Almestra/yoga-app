# Yoga App

A booking application for a yoga studio: members sign up and enrol in sessions, administrators manage the sessions and their teachers. Angular 19 front end, Spring Boot 3.5 back end, MySQL database.

This repository takes over the application as it was delivered for a training project and brings it to a maintainable state: an [audit](docs/AUDIT.md) of 50 problems, the refactoring of both parts, the fixes of the defects found, and three test suites with at least 80 % coverage each.

## Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the application](#running-the-application)
4. [Tests](#tests)
5. [Known limits](#known-limits)
6. [Project history](#project-history)
7. [Documentation](#documentation)

## Prerequisites

- Node.js 22 and npm 10, for the front end. The Angular CLI is installed with the project.
- Java 21.
- Docker Desktop, or Docker Engine with Compose: the back end starts its database with Docker Compose, and its integration tests start their own with Testcontainers.
- Google Chrome, for the end-to-end tests.

Maven is not needed: the back end comes with the Maven Wrapper (`mvnw`).

## Installation

```bash
git clone https://github.com/Almestra/yoga-app.git
cd yoga-app
```

### Back end: the `.env` file

The back end reads its settings from `back/.env`, which is not versioned because it holds the secrets of each installation. Create it from the example:

```bash
cd back
cp .env.example .env
```

Then fill in its three empty values:

- `DB_PASSWORD` and `DB_ROOT_PASSWORD`: passwords of your choice. MySQL only reads them when it creates the database, at the first start: changing them later has no effect on an existing database.
- `TOKEN_SECRET`: the key that signs the tokens, at least 64 random bytes encoded in Base64. To generate one:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Front end

```bash
cd front
npm ci
```

## Running the application

### Back end

Start Docker, then run from the `back` folder:

```bash
./mvnw spring-boot:run
```

The back end must be started from the `back` folder, because it reads `.env` through a path relative to the working directory. Spring Boot then starts the MySQL container described in `compose.yaml` (MySQL 26.7.0, reachable from this machine only), creates the tables and listens on port 8080.

### Initial data

The database starts empty. Once the back end has started and created the tables, load the administrator account and two teachers, from the `back` folder, in Bash or PowerShell:

```bash
docker cp src/main/resources/sql back_mysql:/tmp/
docker exec back_mysql sh -c 'cat /tmp/sql/*.sql | MYSQL_PWD=$MYSQL_PASSWORD mysql --default-character-set=utf8mb4 -u $MYSQL_USER $MYSQL_DATABASE'
```

Run these commands once only. The administrator logs in with `yoga@studio.com` and the password `test!1234`.

### Front end

From the `front` folder:

```bash
npm start
```

The application opens at http://localhost:4200. The development server forwards the `/api` requests to the back end on port 8080.

## Tests

| Suite | Tools | Tests | Unit | Integration |
|---|---|---|---|---|
| Front end | Jest | 117 | 81 | 36 (30.8 %) |
| End to end | Cypress | 84 | | |
| Back end | JUnit 5, Mockito, Testcontainers | 135 | 23 | 112 (83.0 %) |

The share of integration tests is the number of integration tests divided by all the tests of the suite. The brief of the training project asks for at least 30 % on the front end and on the back end.

### Front end: Jest

From the `front` folder:

```bash
npm test
npm run test:coverage
```

- A unit test (`*.spec.ts`) checks one component or one service alone: a component with stubs of the services that call the API, a service with a simulated HTTP back end.
- An integration test (`*.integration.spec.ts`) starts the real application, with its routes, guards, interceptor and services, and simulates only the HTTP back end.
- `test:coverage` writes the report to `front/coverage/jest/index.html` and fails if one of the four indicators is under 80 %.
- The specs are compiled to ES2016, so that `await` works with the Angular Material test harnesses: each `?.` and `??` therefore counts as branches in the report.
- The tests run on jsdom 26: the older version installed by default rejects the style sheets of the Angular CDK.

### End to end: Cypress

From the `front` folder, with Chrome installed:

```bash
npm run e2e:ci
npm run e2e:coverage
```

- `e2e:ci` serves an instrumented build of the application on port 4201 and runs the seven specs in headless Chrome: the common frame (navigation, logout), login, register, session list, session detail (participation, deletion), session form (creation, update) and account.
- `e2e:coverage` prints the coverage, writes the report to `front/coverage/e2e/index.html` and fails under 80 %. It counts the same TypeScript files as Jest.
- `npm run e2e` opens the Cypress window on the same instrumented server.
- The API is simulated with `cy.intercept`, with answers captured from the real back end (`cypress/fixtures`): the suite needs no back end, but it does not test the connection between the two parts.
- The time zone of the browser is forced to UTC, so that the dates displayed do not depend on the machine.

### Back end: JUnit and Mockito

From the `back` folder, with Docker running and `.env` created (the tests only need its `TOKEN_SECRET`):

```bash
./mvnw test
./mvnw verify
```

- `test` runs the unit tests (`*Test`), without Docker. Each one checks a class alone, mainly the services; the repositories it uses are replaced by Mockito stubs.
- `verify` adds the integration tests (`*IT`): the application starts on a random port with a real MySQL 26.7.0 started by Testcontainers, and the tests send real HTTP requests, with nothing mocked. It then writes the report to `back/target/site/jacoco/index.html` and fails if a counter is under 80 %.
- The coverage leaves out the DTO-type classes (`dto`, `payload`), the code generated by Lombok and the mappers generated by MapStruct.
- Mockito warns that it loads its agent dynamically on Java 21: the warning is harmless and left as is.

### Code style

- Front end: `npm run lint` (ESLint) and `npm run format:check` (Prettier).
- Back end: `./mvnw spotless:check`, and `./mvnw spotless:apply` to reformat.

## Known limits

The limits of the project itself, such as Angular 19 and Spring Boot 3.5 kept, the MySQL version pinned and the login state kept in memory, are explained in [section 5 of the audit](docs/AUDIT.md#5-limits-of-the-project). Other known limits:

- **Tests**: no test checks that an expired token is refused. The end-to-end tests simulate the API, so only the manual tests check the connection between the two parts. The unit tests of the page components replace services of the application with stubs.
- **Application**: a session's date is displayed in the time zone of the viewer, so the day before west of Greenwich. The back arrows have no accessible name. When the session list cannot be loaded, no message is shown.

## Project history

The work was done in blocks, each on its own branch merged through a pull request. Every commit that solves a problem of the audit cites it (`Refs RX-01`).

| Block | Pull requests |
|---|---|
| Audit and manual tests | [#1](https://github.com/Almestra/yoga-app/pull/1) |
| Make the project runnable | [#2](https://github.com/Almestra/yoga-app/pull/2) |
| Front-end refactoring | [#3](https://github.com/Almestra/yoga-app/pull/3) |
| Back-end refactoring | [#4](https://github.com/Almestra/yoga-app/pull/4) |
| Access rights | [#5](https://github.com/Almestra/yoga-app/pull/5) |
| Defects: data, then interface | [#6](https://github.com/Almestra/yoga-app/pull/6), [#7](https://github.com/Almestra/yoga-app/pull/7) |
| Tests: front end, end to end, back end | [#8](https://github.com/Almestra/yoga-app/pull/8), [#9](https://github.com/Almestra/yoga-app/pull/9), [#10](https://github.com/Almestra/yoga-app/pull/10) |
| Clean-up: back end, front end, configuration | [#11](https://github.com/Almestra/yoga-app/pull/11), [#12](https://github.com/Almestra/yoga-app/pull/12), [#13](https://github.com/Almestra/yoga-app/pull/13) |
| Documentation | this README |

## Documentation

- [Audit](docs/AUDIT.md): the problems found in the application as delivered, the gaps with the brief and the plan.
- [Manual tests](docs/MANUAL-TESTS.md): how the application behaved before the changes, and which changes were deliberate.
- [Postman collection](back/postman/yoga.postman_collection.json): the requests of the API.
