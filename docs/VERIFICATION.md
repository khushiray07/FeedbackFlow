# M10 verification record

Date: 2026-10-09. Target: local React/Vite and Express application with the configured MongoDB Atlas development database. Existing Atlas records were not reset or deleted.

## Automated checks

| Check | Result |
|---|---|
| `npm run lint` | Passed |
| `npm run build` | Passed; Vite reports a non-failing chunk-size warning for the 527.38 kB JavaScript bundle |
| `npm test` | Passed after local port binding permission: 84 server and 9 client tests, 0 failures |

The first sandboxed `npm test` attempt stopped before tests ran because MongoMemoryServer could not bind `0.0.0.0` (`EPERM`). The identical suite passed with local port binding permission.

## PRD acceptance evidence

| Requirement | Evidence | Remaining browser check |
|---|---|---|
| FR-01 Authentication | Atlas-backed API registration/login/logout/session; Chrome admin login, logout and anonymous redirect; server auth tests; user reports regular-user registration and signed-in session | Independent Chrome observation of regular-user registration and session refresh |
| FR-02 Feedback creation | Chrome required-length validation and successful submission of one safe development record; Atlas persistence; server validation tests | None for basic flow |
| FR-03 Feedback board | Chrome Atlas board, detail, refresh, loading skeleton and two distinct pagination pages with accurate total; server listing tests | Network error recovery |
| FR-04 Voting | Chrome authenticated vote, refresh persistence, removal, anonymous redirect; Atlas API and concurrency/idempotency server tests | None for basic flow |
| FR-05 Discovery | Chrome search, combined category/status filter, empty state, page reset, newest/most-voted order; Atlas API and server sorting tests | None for basic flow |
| FR-06 Feedback details | Chrome detail, navigation and voting; server invalid/missing ID tests | None for basic flow |
| FR-07 Roadmap | Chrome grouped Atlas records, empty Completed lane, card navigation, immediate update after admin status change; server grouping/ranking tests | Responsive mobile lane UI |
| FR-08 Admin | Chrome dashboard statistics and status change; anonymous direct `/admin` redirected to login; live Atlas admin provisioning/login/stats/update/sync and regular-user 403 checks; server tests | Chrome regular-user direct-route rejection |
| FR-09 Responsive UI | Source reviewed against Stitch exports in M7; Chrome modal and form controls exposed accessible names | Desktop/mobile visual comparison, keyboard/focus sweep |

The preceding Atlas integration verification is recorded in `AI_DEVELOPMENT.md`. Its API and Chrome results are distinguished above from new M10 checks. Browser and admin items remain open until exercised; passing automated tests are not presented as proof of those UI journeys.

## Security and code review

Reviewed server-side Origin enforcement, cookie-backed authentication, database-backed admin authorization, strict feedback validation, escaped search, server-side sorting before pagination, and vote uniqueness/idempotency. No security protection was relaxed. The existing admin seed script validates and hashes a new password and refuses to modify an existing user.

## Open verification work

- Complete independent Chrome regular-user registration/session/direct-route, responsive/keyboard, and network failure checks. The user reported that a regular account was registered and that their name and Log out appeared after refresh; the app-control window did not consistently expose that same session, so this remains user-confirmed rather than agent-observed.
- Chrome DevTools showed the admin render error before the fix and no console messages immediately after the repaired page reloaded. A broader console sweep across all pages remains open.

## Live Atlas admin check

After the user confirmed that the three local `ADMIN_*` values were saved, `npm run seed:admin --workspace server` created one development administrator. An Atlas-backed API check then logged in as that administrator, read statistics, changed only the previously created development feedback record `6ac86809dddbdb742d8be4d1` to `planned`, and confirmed the status in details, filtered listing, and roadmap. A new regular development test user received 403 from both `GET /api/admin/stats` and `PATCH /api/feedback/:id/status`. The administrator password and test-user password were never printed. No existing Atlas data was deleted or reset.

## Chrome findings and fix

Admin sign-in was completed by the user. Chrome initially rendered a blank `/admin` page. Its console showed `Cannot destructure property 'refreshKey' of 'useOutletContext(...)' as it is undefined` in `AdminDashboard`. `RequireAdmin` inserted a nested route outlet but did not forward the parent layout context. Codex passed that context through its `<Outlet>`. After reload, the dashboard rendered live totals, and changing an earlier development record to In Progress updated its row, statistics, and public roadmap group. Direct `/admin` navigation after logout redirected to `/login?returnTo=%2Fadmin`.

Chrome also confirmed form validation, feedback submission, detail navigation, vote persistence after refresh, vote removal, anonymous vote redirect, search/filter/empty/loading states, most-voted ordering, and a second pagination page. Seven clearly labeled development feedback records were added solely to cross the default ten-item page boundary; they remain in Atlas. The sorting test vote was removed. Browser checks did not alter unrelated pre-existing records.

M11 deployment readiness is pending these M10 browser and administrator checks.
