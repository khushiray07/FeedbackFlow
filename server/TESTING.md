# Foundation verification

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
prefix server secrets with `VITE_`.

`npm test` needs no `.env`, MongoDB account or externally running service. It does
not establish a persistent development database: its MongoDB shuts down afterward.

The controlled admin script is part of Foundation tooling, not an authentication
API. Configure ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD locally and run
`npm run seed:admin --workspace server` only against the intended database. It hashes
the password and refuses duplicate emails without promoting/resetting an account.
Remove ADMIN_PASSWORD afterward. No actual account is seeded by tests outside the
temporary database. Authentication and feedback/voting routes remain unimplemented.

Mongoose references validate ObjectId types, not foreign-key existence. Later
authenticated APIs must derive authors from sessions, reject protected fields and
check feedback existence before voting. Model defaults alone are not authorization.
