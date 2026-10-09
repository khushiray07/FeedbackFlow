# Backend verification

From the repository root, run `npm run lint`, `npm run build`, and `npm test`.
Node 24.11.1 is recorded in `.nvmrc`; install dependencies using `npm ci`.

Tests use a real MongoDB binary managed by `mongodb-memory-server`. The first
install/run needs internet access to download that binary, and the process needs
permission to bind a local port. A startup failure fails the suite; it does not
silently skip database assertions or substitute mocks.

The runner creates its own MongoDB process bound to 127.0.0.1, supplies its URI
through Vitest's setup context, and generates a unique `feedbackflow_test_` database
name for each test file. It does not load `.env`; application and external test
URIs are cleared in workers. A guard rejects non-test environments, remote hosts,
credentials, URI options and non-test database names before connection. Cleanup
only disconnects clients and stops the owned temporary process; no database-drop
or collection-delete operations are used. Do not replace this setup with an Atlas
URI. Ordinary test runs cannot target your development or production database.

For local application startup, copy the root `.env.example` to root `.env` and set
`MONGODB_URI` to a running local MongoDB (the example uses port 27017 and database
`feedbackflow`) or your own Atlas development connection string. Atlas requires a
database user with permissions on that development database and network access
for your machine. Keep credentials out of Git and chat. `npm run dev` and `npm start`
load the root `.env`; an existing process environment takes precedence. Never
prefix server secrets with `VITE_`. M3 also requires a strong random `JWT_SECRET`
of at least 32 bytes and an exact `APP_ORIGIN` (no path or trailing slash). Browse
`http://localhost:5173` when using the example APP_ORIGIN; if you use 127.0.0.1
instead, change APP_ORIGIN to match. Production requires an HTTPS origin.

`npm test` needs no `.env`, MongoDB account or externally running service. It does
not establish a persistent development database: its MongoDB shuts down afterward.

The controlled admin script is part of Foundation tooling, not an authentication
API. Configure ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD locally and run
`npm run seed:admin --workspace server` only against the intended database. It hashes
the password and refuses duplicate emails without promoting/resetting an account.
Remove ADMIN_PASSWORD afterward. No actual account is seeded by tests outside the
temporary database. Feedback/voting routes remain unimplemented.

## M3 authentication

The implemented routes are POST /api/auth/register, POST /api/auth/login,
POST /api/auth/logout, and GET /api/auth/me. Registration establishes a session.
All mutation requests require an Origin header exactly matching APP_ORIGIN,
including requests from command-line API clients. No browser bearer token storage
or cross-origin deployment is needed; use Vite's /api proxy during development.

Passwords require eight characters and one number at registration, with a maximum
of 72 UTF-8 bytes to avoid bcrypt truncation. Login does not impose the registration
composition policy on existing accounts. Bcrypt uses cost 12. Public registration
rejects role/passwordHash injection and always creates a regular user.

Sessions are HS256 JWTs with fixed issuer/audience and a 24-hour lifetime. Cookies
use HttpOnly, SameSite=Lax, Path=/ and Secure in production. Startup rejects absent
or invalid authentication configuration. The current database record supplies
permissions, so role changes apply without waiting for JWT expiry. Auth responses
are marked no-store and expose only id, name, email and role.

Logout clears the browser cookie. As documented in the approved plan, it does not
revoke a previously copied token; such a token remains valid until its 24-hour
expiry. No refresh-token or token-revocation service is included in M3.

Run `npm test --workspace server -- auth.test.js` for focused authentication tests,
or `npm test` for all tests. The isolated runner generates its own test JWT secret.
Test-only protected/admin routes verify middleware without introducing later
product endpoints. Production cookie flags are tested via HTTP response headers;
deployed HTTPS browser behavior still needs release-time verification.

M3 verification: lint and production build passed; all four test files and 58 tests
passed against disposable MongoDB, including 23 authentication/access-boundary
cases. The original Stitch files were unchanged in the Git comparison.

Mongoose references validate ObjectId types, not foreign-key existence. Later
authenticated APIs must derive authors from sessions, reject protected fields and
check feedback existence before voting. Model defaults alone are not authorization.
