# Audit — Yoga App

Audit of a yoga-studio booking application (Angular front, Spring Boot back) as it was delivered, before any change. "The brief" is the assignment of the training project it comes from: refactor the front and the back without regression, then cover the application with automated tests; its requirements are listed in [section 4](#4-gaps-with-the-brief).

## Contents
1. [Summary](#1-summary)
2. [Approach](#2-approach)
3. [Problems identified](#3-problems-identified)
4. [Gaps with the brief](#4-gaps-with-the-brief)
5. [Limits of the project](#5-limits-of-the-project)
6. [Plan](#6-plan)

## 1. Summary

The application starts and its main journeys work, but:

1. **None of the refactoring criteria of the brief is met.**
    - Front: 12 subscriptions never released, 19 `*ngIf` / `*ngFor`, 3 `any`.
    - Back: error handling copied from one controller to the next, and a controller that talks to a repository.
2. **The API reports its errors wrongly.** Every error handled by Spring comes back as a 401 with an empty body, even with a valid token.
3. **Access rights exist only in the interface.** The API lets any logged-in user create, modify or delete a session and enrol someone else.
4. **Some defects block the user or damage data.** A teacher can teach only one session, editing a session removes its participants, and a failed request gives no feedback.
5. **The test and build tooling is incomplete or broken.** 8 of the 12 front spec files fail, the back has no test, the coverage rules contradict the brief, and the back could not be built with a recent version of Maven.

**48 problems identified**:
- 🔴 21 high: the user is blocked or receives wrong information, data or access rights are at risk, or a criterion of the brief is not met.
- 🟠 15 medium: technical debt, or a defect that hinders some users without preventing them from using the application.
- 🟡 12 low: readability, style, modernisation, or a gap with no effect on use.

## 2. Approach

Both parts were started (the back with `mvn spring-boot:run` and its MySQL container, the front with `ng serve`), the admin and two teachers were inserted, and every source file was read. The application was then exercised by hand.

- **Environment**:
  - Back: Java 21, Spring Boot 3.5, Maven 3.10, MySQL 26.7 (image `mysql:latest`).
  - Front: Angular 19.2, TypeScript 5.8, RxJS 7.8, Jest 29.7, Cypress 15.2.
- **Manual tests** ([see details here](MANUAL-TESTS.md)):
  - ✅ nominal behaviour: the API sequence built from the Postman collection and the nominal interface scenarios behave as expected;
  - ❌ API: the errors that Spring handles itself answer 401 with an empty body instead of their real code, and a non-admin token is enough to modify a session or enrol someone else;
  - ❌ interface: 13 of the 30 scenarios reveal a defect, from a button that does nothing to participants removed by an edit;
  - ⚠️ `ng serve` and `ng build` succeed with warnings; with Jest, 8 of the 12 spec files fail.
- **Worth noting**:
  - the front is already made of standalone components, uses `inject()` and a functional interceptor, and keeps its HTTP calls in services;
  - the back already has services, DTOs and MapStruct mappers: the layers exist, they are not always respected.

## 3. Problems identified

The notes under a table explain the problems that need it. Line numbers refer to the starter.

### 3.1 Front: observables, typing, templates

| Problem | Where | Severity |
|---|---|:-:|
| **RX-01** — 12 manual `subscribe()` calls, none released: no `takeUntilDestroyed`, no `ngOnDestroy` | `me`, `login`, `register`, `detail` and `form` components | 🔴 |
| **RX-02** — Nested subscription: the teacher is loaded inside the subscription to the session | `detail.component.ts` l. 68-76 | 🟠 |
| **TS-01** — 3 explicit `any`: `Observable<any>` returned by the two `delete()` methods, `(_: any)` in a callback | `session-api.service.ts` l. 24, `user.service.ts` l. 19, `detail.component.ts` l. 52 | 🔴 |
| **TS-02** — Method without return type: `back()` | `detail.component.ts` l. 45 | 🔴 |
| **TS-03** — 12 non-null assertions (`sessionInformation!`, `user!.admin`, `this.id!`) that hide a value which may be missing | 5 files | 🟡 |
| **TPL-01** — 19 `*ngIf` / `*ngFor` instead of `@if` / `@for` | 7 templates | 🔴 |

**Notes:**
- **RX-01**: these are HTTP calls that complete on their own, so nothing leaks today; but a callback can still run after its component is destroyed, and the risk becomes real as soon as a stream stays open.

### 3.2 Front: forms

| Problem | Where | Severity |
|---|---|:-:|
| **FORM-01** — `Validators.min` / `max` used instead of `minLength` / `maxLength`: they compare numbers, not lengths | `login.component.ts` l. 38, `register.component.ts` l. 32-49, `form.component.ts` l. 80 | 🟠 |
| **FORM-02** — No message next to an invalid field, and the same "An error occurred" for a wrong password or an email already used | `login`, `register` and `form` templates | 🟠 |

**Notes:**
- **FORM-01**: Angular reads the value with `parseFloat`. As a password, `12` is accepted, `123456` is refused (above 40), and any text that does not start with a digit is accepted whatever its length. The back applies other limits (`SignupRequest.java`, `SessionDto.java`): password of 6 to 40 characters, names of 3 to 20, description of 2,500. The form therefore accepts values that the API rejects.

### 3.3 Front: interface

| Problem | Where | Severity |
|---|---|:-:|
| **UI-01** — No error handling on session creation, update and deletion, on participation and on account deletion: when the request fails, nothing happens on screen | `form.component.ts`, `detail.component.ts`, `me.component.ts` | 🔴 |
| **UI-02** — The eye button of the login form has no `type="button"`: the form is submitted on every second click | `login.component.html` l. 14 | 🟠 |
| **UI-03** — Register: the password is displayed in clear (input without `type`) | `register.component.html` l. 18 | 🟠 |
| **UI-04** — `UnauthGuard` sends a logged-in user to the route `rentals`, which does not exist: "Page not found !" after the browser Back button | `unauth.guard.ts` l. 16 | 🟠 |
| **UI-05** — The back arrow of the session form does nothing: `routerLink` is used without importing `RouterModule` | `form.component.html` l. 5, `form.component.ts` l. 14 | 🟠 |
| **UI-06** — The button that deletes the account is labelled "Detail" | `me.component.html` l. 20 | 🟠 |
| **UI-07** — List title "Rentals available", left over from another project | `list.component.html` l. 4 | 🟡 |

**Notes:**
- **UI-01**: seen in the situations of **DATA-01** and **DATA-03**.
- **UI-02**: Angular cancels the default action of a click when its handler evaluates to `false`. `hide = !hide` is `false` when the password becomes visible and `true` when it is hidden again: that second click submits the form, and logs the user in if the credentials are valid.

### 3.4 Back: error handling and layers

| Problem | Where | Severity |
|---|---|:-:|
| **API-01** — Error handling copied into the controllers: 8 `try/catch (NumberFormatException)` and `null` checks that return 404 | `SessionController`, `TeacherController`, `UserController` | 🔴 |
| **API-02** — Errors handled by Spring reach the client as 401 with an empty body, even with a valid token | `WebSecurityConfig.java` l. 61-68 | 🔴 |
| **API-03** — `POST /api/session` accepts an unknown `teacher_id`: the session is stored without teacher, and its detail page then fails | `SessionMapper.java` l. 30, `detail.component.ts` l. 74 | 🔴 |
| **API-04** — The response of `PUT /api/session/{id}` contains `"createdAt": null`, although the stored date is intact | `SessionService.java` l. 41-44 | 🟡 |
| **ARCH-01** — `AuthController` calls `UserRepository` directly and holds the registration and login logic | `AuthController.java` l. 53, 68-81 | 🔴 |
| **ARCH-02** — Business rules in controllers: ownership check before deleting an account, existence checks before deletions | `UserController.java` l. 49-61, `SessionController.java` l. 82-88 | 🔴 |
| **ARCH-03** — `SessionMapper` calls `TeacherService` and `UserService`, and turns an unknown identifier into `null` | `SessionMapper.java` l. 30-31 | 🟠 |

**Notes:**
- **API-02**: observed on validation failures, malformed JSON, participation on an unknown session or user, unknown URL, unsupported method and server errors. Most likely cause: Spring forwards these errors to its `/error` page, and the security rules block that page because the JWT filter does not run on this internal forward. A client cannot tell an invalid form from an expired login.

### 3.5 Back: data and security

| Problem | Where | Severity |
|---|---|:-:|
| **DATA-01** — `Session.teacher` is mapped `@OneToOne`: the resulting unique index on `sessions.teacher_id` limits a teacher to one session | `Session.java` l. 63-65 | 🔴 |
| **DATA-02** — Updating a session replaces its participants with the `users` of the request; the form does not send them, so every edit removes all participants | `SessionService.java` l. 41-44, `form.component.ts` | 🔴 |
| **DATA-03** — A user enrolled in a session cannot delete their account: the request fails, most likely on the foreign key of `participate` | `UserService.java`, `Session.java` l. 67-72 | 🟠 |
| **DATA-04** — No primary key or unique constraint on `participate` | `Session.java` l. 67-72 | 🟡 |
| **SEC-01** — No authorisation on the back: any logged-in user can create, modify or delete a session and read any user's record | `WebSecurityConfig.java` l. 59-64, `UserDetailsServiceImpl.java` | 🔴 |
| **SEC-02** — The participation endpoints trust the `userId` of the URL: a user can enrol or remove someone else | `SessionController.java` l. 95-115 | 🔴 |
| **SEC-03** — Secrets are versioned: JWT secret and database password in `back/.env`, root password in `compose.yaml` | `back/.env`, `compose.yaml` l. 9 | 🟠 |

**Notes:**
- **DATA-01**: with two teachers, the application cannot hold more than two sessions. The next creation fails without any message (**UI-01**).
- **DATA-02**: an admin who fixes a typo in a description cancels every registration, silently.
- **SEC-01**, **SEC-02**: `UserDetailsServiceImpl` gives users no authority, so the back cannot tell an admin from another user: the restriction exists only in the interface.

### 3.6 Clean code

| Problem | Where | Severity |
|---|---|:-:|
| **CLEAN-01** — Dead code: `AuthEntryPointJwt` entirely commented out but still a `@Component`, unused injections in `AppComponent` and `DetailComponent` | several files | 🟡 |
| **CLEAN-02** — Misleading names: the two `DELETE` handlers are called `save` | `SessionController.java` l. 80, `UserController.java` l. 47 | 🟡 |
| **CLEAN-03** — Inconsistent injection: `@Autowired` fields next to constructor injection on the back; guard constructors next to `inject()` on the front | `SessionMapper`, `AuthTokenFilter`, `WebSecurityConfig`, `guards/` | 🟡 |
| **CLEAN-04** — Untyped responses (`ResponseEntity<?>`), whole objects written to the log (`log.info(sessionDto)`), deprecated jjwt calls | controllers, `JwtUtils.java` | 🟡 |

### 3.7 Tooling and dependencies

| Problem | Where | Severity |
|---|---|:-:|
| **TOOL-01** — `spring-boot-maven-plugin` declared twice: Maven 3.10 refuses to read the project, Maven 3.9 only warns | `back/pom.xml` | 🔴 |
| **TOOL-02** — No teacher in the database and no way to create one: no session can be created from the interface on a fresh install | `back/src/main/resources/sql/` | 🔴 |
| **TOOL-03** — No usable linter: `lint` script without `lint` target, legacy `.eslintrc.json` ignored by ESLint 9, `@angular-eslint` 20 on an Angular 19 project | `angular.json`, `package.json` l. 8 | 🟠 |
| **TOOL-04** — `package.json` omits `@angular/cli`, `@angular/compiler-cli` and `typescript`, and pins `@angular/animations` alone: `npm install` needs the lock file | `front/package.json` | 🟠 |
| **TOOL-05** — Moving tag `mysql:latest`: 9.1 in the README, 26.7 today | `back/compose.yaml` l. 3 | 🟠 |
| **TOOL-06** — Postman collection out of date: its Bearer token is hard-coded and expired, and its sample values do not match the seed data (`create` targets teacher 5; `user / delete` targets user 1, the admin account) | `back/postman/` | 🟡 |
| **TOOL-07** — Build warnings: `tsconfig.json` targets `es2020` and is overridden by the CLI, placeholder `project-name:build` in the `serve` options, initial bundle over budget | `tsconfig.json` l. 19, `angular.json` l. 84 | 🟡 |
| **TOOL-08** — Unused dependencies: `@angular/flex-layout` (deprecated and never imported, so its 49 `fx*` attributes in the templates have no effect), `@briebug/jest-schematic` (one-shot generator) | `front/package.json`, 7 templates | 🟡 |
| **TOOL-09** — No Maven Wrapper: building requires a local Maven of a suitable version | `back/` | 🟡 |

### 3.8 Tests

| Problem | Where | Severity |
|---|---|:-:|
| **TEST-01** — Front: 8 of the 12 spec files fail (standalone components listed in `declarations`); the 4 others only check that a service is created | `*.spec.ts` | 🔴 |
| **TEST-02** — Back: no test, `back/src/test` does not exist | `back/` | 🔴 |
| **TEST-03** — End to end: a single spec (`login.cy.ts`); the nyc configuration file is named `nycrc` without its leading dot, so nyc ignores it | `front/cypress/`, `front/nycrc` | 🔴 |
| **TEST-04** — Coverage rules contradict the brief: Jest checks statements only; JaCoCo demands 90 % of lines per package, excludes no DTO, and its version 0.8.5 predates Java 21 | `jest.config.js` l. 15, `pom.xml` l. 145-175 | 🔴 |

### 3.9 Documentation

| Problem | Where | Severity |
|---|---|:-:|
| **DOC-01** — No README at the root; the front README gives the clone URL of another repository; the back README gives a wrong path for the admin script | `front/README.md` l. 9, `back/README.md` l. 101 | 🔴 |
| **DOC-02** — Undocumented constraint: `AppConfig` reads `.env` through a relative path, so the back only starts from the `back/` folder | `AppConfig.java` l. 14 | 🟠 |

## 4. Gaps with the brief

| Requirement | Current state | Ref. |
|---|---|---|
| Tools installed, front and back started | ✅ After fixing the POM | TOOL-01 |
| `ng serve` without error | ✅ With warnings | TOOL-07 |
| Subscriptions released (`takeUntilDestroyed`) | ❌ 12 subscriptions, none released | RX-01 |
| No `any` | ❌ 3 occurrences | TS-01 |
| Return type on every method | ⚠️ One method without | TS-02 |
| `@if` / `@for` instead of `*ngIf` / `*ngFor` | ❌ 19 structural directives | TPL-01 |
| Centralised exception handling | ❌ 8 `try/catch`, no `@ControllerAdvice` | API-01 |
| Controller, service, repository | ❌ `AuthController` calls a repository | ARCH-01 |
| Business logic in the services | ❌ Rules in controllers and in a mapper | ARCH-02, ARCH-03 |
| Front unit and integration tests (Jest) | ❌ 8 of the 12 spec files fail | TEST-01 |
| End-to-end tests of every screen (Cypress) | ❌ A single spec | TEST-03 |
| Back unit and integration tests | ❌ None | TEST-02 |
| Coverage of at least 80 %, DTO excluded | ❌ The configured rules do not match | TEST-04 |
| README: install, run, test, coverage reports | ❌ Two partial READMEs, with errors | DOC-01 |
| Testing plan: error shown when a required field is missing | ⚠️ No message: the submit button is disabled | FORM-02 |

**Note:** the testing plan of the brief lists the Create and Detail buttons as reserved for admins. In the code, Detail is open to everyone, and Create and Edit are reserved for admins. This reads as a slip in the testing plan: a user needs the detail page to join a session. The tests will follow the code.

## 5. Limits of the project

- **Angular 19**: the project stays on the version delivered with the starter, although it is no longer maintained (131 vulnerabilities reported by npm, 8 of them in Angular itself; most can only be fixed by a major upgrade).
- **Login state**: kept in memory only, so reloading the page logs the user out. This is the safest place for the token; it is kept as is.

## 6. Plan

- **One branch and one pull request per block**, with atomic commits that cite the problem they solve (`Refs RX-01`).
- **The [manual tests](MANUAL-TESTS.md) are replayed after each block, to guard against regressions.** A change of behaviour is never mixed with a refactoring: it gets its own commit and is recorded there.

The blocks, in order of priority:

### 6.1 Make the project runnable without workarounds

Done on `chore/setup` (**TOOL-01**, **TOOL-02**, **TOOL-06**): the duplicate plugin declaration is removed, which leaves the effective POM unchanged; a script inserts two teachers; the Postman `login` request stores its token in a collection variable, and the sample values of the collection are aligned with the seed data.

### 6.2 Front refactoring

- **Linter** (**TOOL-03**): ESLint aligned on Angular 19, set up first. The rules `no-explicit-any`, `explicit-function-return-type` and `prefer-control-flow` prove that the criteria are met; `no-non-null-assertion` does the same for **TS-03**.
- **Subscriptions** (**RX-01**, **RX-02**): the `async` pipe where data is only displayed, `takeUntilDestroyed` on the remaining manual subscriptions, `switchMap` to load the teacher after the session.
- **Typing** (**TS-01** to **TS-03**): `Observable<void>` for the two deletions, an explicit return type on every method, and the non-null assertions replaced by explicit checks.
- **Templates** (**TPL-01**): `@if` / `@for`, migrated with the Angular schematic (`ng generate @angular/core:control-flow`) and then reviewed.

### 6.3 Back refactoring

- **Errors** (**API-01**): a `@RestControllerAdvice` maps each exception to its status; the services throw `NotFoundException` and `BadRequestException`; identifiers are received as `Long`.
- **Layers** (**ARCH-01** to **ARCH-03**): an authentication service takes over the logic of `AuthController`; ownership and existence checks move to the services; the mapper no longer calls services.
- **Unknown teacher** (**API-03**): a session with an unknown `teacher_id` is refused with 400 instead of being stored without teacher.
- **Session update** (**API-04**): the response returns the stored creation date instead of `null`.
- **Maven Wrapper** (**TOOL-09**): added with this block.

This block also restores the real error codes (**API-02**): an invalid request body answers 400 instead of 401, an unknown session or user 404, leaving a session without being enrolled 400. These are deliberate changes, not regressions. Every case, before and after, is listed [here](MANUAL-TESTS.md#3-api-error-cases).

### 6.4 Access rights

The back gives each user a role and checks it (**SEC-01**, **SEC-02**). A logged-in user who lacks the right receives 403.

| Action | Allowed to |
|---|---|
| Read sessions and teachers | Any logged-in user |
| Create, update or delete a session | Admins |
| Enrol or remove a participant | The user concerned, or an admin |
| Read a user's record | The user concerned, or an admin |
| Delete an account | Its owner only |

Deleting someone else's account therefore answers 403 instead of 401. These rules only concern the API: the interface already keeps to them. They come after the back refactoring, because a refusal can only be reported correctly once **API-02** is fixed.

### 6.5 After these blocks

1. **Defects**:
   - data: **DATA-01** to **DATA-04**;
   - feedback when a request fails: **UI-01**;
   - small interface fixes: **UI-02** to **UI-07**, **FORM-01**;
   - form messages: **FORM-02**, with a message under each required field and a distinct message for each server error.
2. **Tests**: the test tooling first, then the tests (**TEST-01** to **TEST-04**).
3. **Documentation and remaining tooling**: **DOC-01**, **DOC-02**, **TOOL-04** to **TOOL-08**, **SEC-03** (a versioned `.env.example` replaces `.env`), and the **CLEAN** items.
