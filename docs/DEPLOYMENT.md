# Render deployment (M11)

This is one Render **Web Service**: Express serves `/api/*` and the compiled Vite client on the same HTTPS origin. The production MongoDB Atlas database is separate from local development data. These instructions prepare the release; the public deployment is complete only after the live checks below pass.

## Render settings

Connect the repository to Render and create one Node Web Service from the deployment commit on `code0/implementation-plan`. PR #1 remains open and must not be merged just to deploy this branch.

| Render field | Value |
|---|---|
| Root directory | Repository root (leave blank) |
| Language/runtime | Node |
| Node version | `NODE_VERSION=24.11.1` (matches the locally verified version; `package.json` also bounds Node to 24) |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Public origin | The service's exact `https://<service-name>.onrender.com` URL |

`--include=dev` installs Vite and its build plugins even when `NODE_ENV=production` is set during the build. The server binds to Render's `PORT` on `0.0.0.0` in production. Do not create a second static site or a separate API service. Render's [web-service guide](https://render.com/docs/web-services), [Node version guide](https://render.com/docs/node-version), and [environment-variable guide](https://render.com/docs/configure-environment-variables) describe these settings.

Set these variables in the **Render Environment** panel, never in Git or a frontend `VITE_` variable:

| Variable | Required value |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `24.11.1` |
| `APP_ORIGIN` | Exact public HTTPS origin, with no trailing slash or path |
| `MONGODB_URI` | Atlas TLS/SRV URI for a dedicated production database, for example a URI whose database path is `/feedbackflow_prod`; use a production-scoped database user |
| `JWT_SECRET` | A newly generated random secret of at least 32 bytes, distinct from development |
| `PORT` | Leave unset; Render supplies it |

The server rejects production startup if `MONGODB_URI` omits the database name, selects `test` or `feedbackflow`, or gives conflicting path and `dbName` values. It connects and initializes the existing indexes before listening. Do not copy the development `.env` into Render. No current development Atlas records need to move.

## Atlas network access

Create or select the separate `feedbackflow_prod` database and a database user scoped to it. In the Render service page, open **Connect → Outbound** and copy the service's outbound CIDR ranges into Atlas **Network Access → IP Access List**. Atlas only accepts connections from allowed addresses. Do not use a broad `0.0.0.0/0` rule as a shortcut. Render documents where to find [outbound ranges](https://render.com/docs/outbound-ip-addresses) and how to [connect to Atlas](https://render.com/docs/connect-to-mongodb-atlas); Atlas documents its [IP access list](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/). Use a TLS/SRV Atlas connection URI and keep the credentials only in Render's environment settings.

## Release and checks

1. Push the reviewed deployment commit to `code0/implementation-plan`; keep PR #1 unmerged. Create the Render Web Service with the settings above and choose a service name before setting `APP_ORIGIN` to its exact assigned HTTPS URL. Select the compute plan deliberately.
2. Add the required environment values and Atlas outbound ranges, then deploy the branch. A successful `/api/health` response is `{"status":"ok"}`. A 503 means MongoDB is unavailable; startup itself waits for MongoDB and indexes.
3. Check `/`, `/roadmap`, `/admin`, and a real `/feedback/:id` after direct browser refresh. Check `/api/not-a-route` returns JSON 404, not `index.html`.
4. Over HTTPS, register a safe production test user, log in, refresh, log out, submit safe feedback, search/filter, vote and remove a vote. Inspect the session cookie for `HttpOnly`, `Secure`, and `SameSite=Lax`. Verify the production Atlas `users`, `feedbacks`, and `votes` collections and the unique `users.email` and `votes(user, feedback)` indexes.
5. After safely provisioning an admin, verify admin login, statistics, a status change on a safe production test record, and the updated public roadmap. Confirm a regular user receives 403 from admin APIs and cannot view `/admin`.
6. Record the deployed commit, public URL, check results, and any failures in `docs/VERIFICATION.md`. A failed build does not establish a new release. Render's [deploy documentation](https://render.com/docs/deploys) explains redeploying or rolling back to a previous successful deploy; there are no M11 data migrations to reverse.

## Production administrator

Public registration always creates regular users. If a production admin is needed, use the existing `npm run seed:admin --workspace server` script once with temporary `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` environment values. It validates and hashes a new password and refuses to promote or overwrite an existing user. Do not put the password in a shell command, log, Git commit, or permanent Render setting. On a Render plan with Shell access, set the temporary values through the service environment, run the script in the Shell, and remove `ADMIN_PASSWORD` immediately afterward. Render's [Shell documentation](https://render.com/docs/ssh) states that Shell access depends on the plan. Alternatively, run the same script locally with a separate ignored production-only environment file and a temporary Atlas allowlist entry for the operator's IP; never point the development `.env` at production for this task. Remove temporary secrets and allowlist entries when done.

## Local verification performed

The M11 local smoke check ran the built server in production mode against a disposable local MongoDB database named `feedbackflow_prod`. Health returned 200 JSON; `/`, `/roadmap`, `/admin`, and `/feedback/:id` returned the React build; unknown `/api/*` returned JSON 404; a wrong mutation Origin returned 403; registration set a Secure, HttpOnly, SameSite=Lax cookie. This does not establish that Render, public HTTPS, Atlas network access, or live browser journeys have passed.
