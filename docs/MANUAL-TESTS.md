# Manual tests — Yoga App

Manual tests that record how the application behaves before any change, defects included. They guard against regressions: replayed after each block of changes, they show that nothing else has changed, until automated tests take over. The references (`UI-01`, `DATA-02`…) point to the problems described in [the audit](AUDIT.md).

In the tables, "Today" is the current behaviour, and "Target" the behaviour once the [plan](AUDIT.md#6-plan) is carried out. A target in bold differs from today: it is a deliberate change, not a regression.

## 1. Starting state

Admin account (see `back/README.md`), two teachers, no session, no other user. To return to it, empty the three tables below, then run `insert_user.sql`:

```sql
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE participate;
TRUNCATE TABLE sessions;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS=1;
```

## 2. API: nominal sequence

Sent with Postman, with the admin token. Each request answers 200.

| # | Request | URL parameters | Body |
|---|---|---|---|
| 1 | `auth / login` | | |
| 2 | `auth / register` | | |
| 3 | `teacher / find all` | | |
| 4 | `teacher / find by id` | `id`: 1 | |
| 5 | `session / create` | | `teacher_id`: 1 |
| 6 | `session / create`, second time | | `teacher_id`: 2 |
| 7 | `session / find all` | | |
| 8 | `session / find by id` | `id`: 1 | |
| 9 | `session / update` | `id`: 2 | `teacher_id`: 2 |
| 10 | `session / participe` | `id`: 1, `userId`: 2 | |
| 11 | `session / no longer participe` | `id`: 1, `userId`: 2 | |
| 12 | `session / delete` | `id`: 2 | |
| 13 | `user / find by id` | `id`: 2 | |

## 3. API: error cases

Like the nominal sequence, the cases of sections 3 and 4 are sent with the admin token, unless stated otherwise.

| Case | Today | Target |
|---|:-:|:-:|
| `GET` or `DELETE` on `/api/session/abc` and `/api/user/abc`; `GET /api/teacher/abc` | 400 | 400 |
| `PUT /api/session/abc`; `POST` or `DELETE /api/session/abc/participate/1` | 400 | 400 |
| `GET` or `DELETE` on `/api/session/999`; `GET` on `/api/user/999` and `/api/teacher/999` | 404 | 404 |
| Any request without token, or with an expired token | 401 | 401 |
| `POST /api/auth/login` with a wrong password | 401 | 401 |
| `POST /api/auth/register` with an email already used | 400 | 400 |
| `DELETE /api/user/{id}` on someone else's account | 401 | **403** |
| `DELETE /api/user/999` | 404 | **403** |
| `POST /api/session`, `/api/auth/login` or `/api/auth/register` with `{}`; malformed JSON | 401 | **400** |
| `POST /api/session/{id}/participate/{userId}` with an unknown session or user; `DELETE` with an unknown session | 401 | **404** |
| `PUT /api/session/999` | 401 | **404** |
| `DELETE /api/session/{id}/participate/{userId}` for a user who is not enrolled | 401 | **400** |
| `POST /api/session/{id}/participate/{userId}` for a user who is already enrolled | 401 | **400** |
| `GET /api/unknown` (unknown URL) | 401 | **404** |
| `DELETE /api/teacher/1` (unsupported method) | 401 | **405** |

## 4. API: known defects

| Case | Today | Target | Ref. |
|---|:-:|:-:|---|
| `POST /api/session` or `PUT /api/session/{id}` with an unknown `teacher_id` | 200 | **400** | API-03 |
| `POST /api/session` with the `id` of an existing session | 200 | 200 | API-04 |
| `PUT /api/session/{id}` | 200 | 200 | API-05 |
| `POST /api/session` for a teacher who already has a session | 401 | **200** | DATA-01 |
| `PUT /api/session/{id}` with a non-admin token | 200 | **403** | SEC-01 |
| `GET /api/user/{id}` of another user, with a non-admin token | 200 | **403** | SEC-01 |
| `POST /api/session/{id}/participate/{userId}` with another user's identifier and a non-admin token | 200 | **403** | SEC-02 |

**Notes:**
- **API-03**: today the session is stored without teacher.
- **API-04**: the status does not change. Today the existing session is overwritten; the target creates a new one.
- **API-05**: the status does not change. Today the response contains `"createdAt": null`; the target returns the stored date.

## 5. Interface scenarios

The scenarios are played after the API sequence, without a reset: one session remains and one teacher is free.

✅ marks a normal behaviour, ❌ a defect, followed by its reference.

### Visitor

| # | Action | Today | Normal |
|---|---|---|---|
| V1 | Open the application | Login page; toolbar: Login, Register | ✅ |
| V2 | Type the URL `/sessions` | Back to the Login page | ✅ |
| V3 | Type an unknown URL | "Page not found !" | ✅ |
| V4 | Login: empty or invalid email | Submit disabled; no message next to the field | ❌ FORM-02 |
| V5 | Login: admin email, wrong password, two clicks on the eye | The form is submitted: "An error occurred" | ❌ UI-02 |
| V6 | Login: same values, Submit | "An error occurred", as for any other failure | ❌ FORM-02 |
| V7 | Register: type a password | Displayed in clear | ❌ UI-03 |
| V8 | Register: password `123456` | Submit stays disabled | ❌ FORM-01 |
| V9 | Register: first name of 2 letters, Submit | "An error occurred" | ❌ FORM-01 |
| V10 | Register: valid account | Back to the Login page | ✅ |

### Admin

| # | Action | Today | Normal |
|---|---|---|---|
| A1 | Log in | Session list; toolbar: Sessions, Account, Logout; Create button; Detail and Edit on each session | ✅ |
| A2 | Read the title of the session list | "Rentals available" | ❌ UI-07 |
| A3 | Browser Back button right after logging in | "Page not found !" | ❌ UI-04 |
| A4 | Create: empty form | Save disabled | ✅ |
| A5 | Create: session with a free teacher | "Session created !", one more session in the list | ✅ |
| A6 | Create: session with a teacher who already has one | Nothing happens | ❌ DATA-01, UI-01 |
| A7 | Back arrow of the form | Nothing happens | ❌ UI-05 |
| A8 | Detail | Name, teacher, attendees, date, description; Delete button, no Participate button; the arrow goes back to the list | ✅ |
| A9 | Edit: change the description, Save | "Session updated !", list up to date | ✅ |
| A10 | Account | Name, email, "You are admin", no delete button | ✅ |
| A11 | Detail, then Delete | "Session deleted !", one session fewer | ✅ |
| A12 | Logout | Login page; toolbar: Login, Register | ✅ |
| A13 | Log in again, then reload the page | Back to the Login page | ✅ |

### User (non-admin), with the account created in V10

| # | Action | Today | Normal |
|---|---|---|---|
| U1 | Log in | List without Create or Edit; Detail available | ✅ |
| U2 | Detail, then Participate | "1 attendees"; the button becomes "Do not participate" | ✅ |
| U3 | Do not participate | "0 attendees"; Participate button | ✅ |
| U4 | Account | Name, email, "Delete my account:" with a red "Detail" button | ❌ UI-06 |
| U5 | Participate; the admin edits the session; come back | "0 attendees" | ❌ DATA-02 |
| U6 | Participate, then delete the account | Nothing happens | ❌ DATA-03, UI-01 |
| U7 | Do not participate, then delete the account | "Your account has been deleted !", back to Login; logging in again fails | ✅ |
