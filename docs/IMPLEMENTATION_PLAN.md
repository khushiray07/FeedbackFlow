# FeedbackFlow Implementation Plan

Status: Plan file creation requested; application implementation awaits separate approval. Saving this document does not authorize Milestone 1.
Prepared: 2026-10-08.

## Context and source review

FeedbackFlow centralizes product suggestions, lets registered users vote, and lets administrators update public development status. Deliver only the approved P0 MVP in docs/PRD.md using the modular MERN monolith in docs/ARCHITECTURE.md.

Reviewed both specifications, all seven code.html exports and their screen.png references under design/stitch_feedbackflow_feature_platform/, and engineered_precision/DESIGN.md. The local file inventory contains these specifications and design references; the plan builds on those artifacts. CodeZero reports its indexed copy is not cloned; local files are authoritative for this checkout. No application tests or package scripts were available in the reviewed inventory.

Precedence: PRD defines behavior; architecture defines technical implementation; Stitch defines visual direction. Where exports conflict with the written design system, use the documented shared tokens and component rules while preserving screen composition. Preserve original design exports.

## Important engineering decisions

The user accepted the modular MERN approach and requested strict PRD scope, preservation of the existing visual design, real Express/MongoDB integration, and a simple maintainable implementation. The five phases below organize the twelve milestones. MongoDB is the sole persistent application data source; React state is only for UI/session presentation, not a substitute backend. The precise session, password, roadmap and response defaults below remain explicit parts of the plan for review rather than hidden implementation assumptions.

## Approach and final structure

Use React → Fetch → Express routes/middleware → controllers/services → Mongoose → MongoDB. Express serves the React build and /api on one production origin. During development, Vite proxies /api to Express. Keep local component state, URL query state, and AuthContext; no Redux, microservices, or additional product features.

Planned structure (names may be refined without changing responsibilities):

```text
docs/
  PRD.md
  ARCHITECTURE.md
  IMPLEMENTATION_PLAN.md
design/                            # existing exports; retain singular name
client/
  src/
    components/
      layout/                      # AppLayout, Navbar, AuthLayout
      common/                      # Button, Modal, FormField, states, Pagination
      feedback/                    # cards, form, VoteButton, badges, filters
      admin/                       # StatsCards, FeedbackTable, StatusSelect
      roadmap/                     # RoadmapLane, status tabs
    pages/                         # FeedbackBoard, FeedbackDetails, Roadmap,
                                   # Login, Register, AdminDashboard, NotFound
    context/AuthContext.jsx
    hooks/                         # feedback loading and shared voting behavior
    services/api.js
    App.jsx
    main.jsx
    index.css                      # shared design tokens and base styles
  index.html
  vite.config.js
  package.json
server/
  src/
    config/db.js
    models/                        # User.js, Feedback.js, Vote.js
    controllers/                   # auth, feedback, vote, roadmap, admin
    services/feedbackService.js    # shared filters, counts, aggregation
    routes/                        # authRoutes, feedbackRoutes, roadmapRoutes,
                                   # adminRoutes
    middleware/                    # authenticate, optionalAuthenticate,
                                   # authorizeAdmin, validate, verifyOrigin,
                                   # errorHandler
    validators/                    # authSchemas, feedbackSchemas
    utils/                         # cookie configuration, safe serialization
    tests/                         # isolated API integration tests
    app.js                         # importable without starting listener
  scripts/seedAdmin.js
  index.js                         # connect, initialize, listen, shut down
  package.json
package.json                       # npm workspaces and orchestration scripts
package-lock.json
.env.example
.gitignore
README.md
AI_DEVELOPMENT.md
```

Technologies prescribed by architecture: React, Vite, React Router, Tailwind CSS, native Fetch, Node.js LTS, Express, MongoDB Atlas, Mongoose, bcryptjs, jsonwebtoken, Zod, Vitest, Supertest. Add cookie-parser for cookie parsing and a small environment-loading mechanism if needed. Use ESLint for basic code checks. Compile Tailwind in the build instead of shipping the export's browser CDN runtime. Use the existing Material Symbols icon direction and explicitly load Geist and JetBrains Mono with fallbacks. Select compatible versions during setup, record the Node version, and commit a lockfile; no versions are asserted by this plan.

## Database and API contracts

### Models and relationships

| Model | Fields and constraints | Indexes |
| --- | --- | --- |
| User | name 2–80; normalized lowercase email; passwordHash; role user/admin, default user; timestamps | Unique email |
| Feedback | title 5–100; description 20–2000; category; status default under_review; author references User; timestamps | createdAt descending; status + createdAt; category + createdAt |
| Vote | user references User; feedback references Feedback; createdAt | Unique (user, feedback); add feedback index for counting and lookups |

Categories: feature, improvement, bug, integration. Statuses: under_review, planned, in_progress, completed. Use lowercase values at API/database boundaries and a shared explicit label mapping in React.

Relationships: User 1:N Feedback; User 1:N Vote; Feedback 1:N Vote. Do not store voter arrays or a separately maintained vote counter. Verify indexes exist before accepting writes; schema declarations alone are not acceptance evidence. Confirm referenced feedback exists before voting.

Only expose author id/name publicly, not email/passwordHash. Derive author from the session and status from the server on creation. Reject attempts to set protected fields. Admin creation uses a controlled script with no hardcoded credentials; public registration cannot assign roles.

### Routes and ownership

| Method and path | Access | Responsibility |
| --- | --- | --- |
| POST /api/auth/register | Public, origin checked | Validate, hash, create user, establish session; authController |
| POST /api/auth/login | Public, origin checked | Check credentials, establish session; authController |
| POST /api/auth/logout | Origin checked | Clear matching session cookie; authController |
| GET /api/auth/me | Authenticated | Return current safe user; authController |
| GET /api/feedback | Public, optional authentication | Search/filter/sort/paginate; feedbackController/service |
| GET /api/feedback/:id | Public, optional authentication | Details with voteCount and hasVoted |
| POST /api/feedback | Authenticated | Create feedback from validated allowed fields |
| PUT /api/feedback/:id/vote | Authenticated | Idempotent vote upsert; voteController |
| DELETE /api/feedback/:id/vote | Authenticated | Idempotent own-vote deletion; voteController |
| GET /api/roadmap | Public | Bounded four-status groups; roadmapController/service |
| GET /api/admin/stats | Admin | Total feedback/votes and four status totals; adminController |
| PATCH /api/feedback/:id/status | Admin | Validate and persist status; adminController via feedbackRoutes |

Use the existing feedback list endpoint for the admin table; no duplicate admin CRUD API. Include roadmapRoutes explicitly because the architecture's example tree omits the required endpoint's route file.

List contract: page defaults to 1; limit defaults to 10 and cannot exceed 50; search maximum 100 characters; sort newest or most_voted; category/status must be valid enums. Propose newest as the default sort. Return the documented data and pagination envelope. Detail/create/status responses use a consistent data wrapper; votes return the documented hasVoted/voteCount pair; auth returns user. Document these previously unspecified envelopes before frontend integration.

Newest: match escaped case-insensitive title/description search plus filters, count matching items, sort createdAt and _id descending, paginate, then compute page vote counts. Most-voted: match, count votes, sort voteCount/createdAt/_id descending, then paginate. Never rank only an already paginated subset.

Proposed roadmap contract: groups keyed by all four statuses; each group includes items and totalItems, plus response limitPerStatus=10. Rank each group by voteCount, createdAt, _id descending. Show “View all” linking to the board filtered by that status when a group is truncated. This reconciles the architecture's bounded response with access to the full public backlog. MVP roadmap cards link to details for voting; omit extra roadmap search/filter controls instead of misleadingly filtering a truncated subset.

Errors use the documented error.code/error.message envelope. Use 400 for invalid IDs/inputs, 401 for missing/expired protected sessions, 403 for forbidden roles/origins, 404 for absent records, 409 for duplicate email, and sanitized 500 responses. Duplicate votes return success. Public reads remain available to visitors and expired sessions; personalized vote state is false until authenticated again.

### Authentication and integration behavior

Use signed JWTs in HttpOnly cookies, Secure over production HTTPS, SameSite=Lax and Path=/. Proposed session duration: 24 hours, matching cookie and token expiry; no “remember for 30 days” option. Verify the token and load the database user on protected requests, including current role. Logout clears the same cookie configuration. Stateless JWT logout clears the browser cookie but does not revoke a copied token before expiry; document that limitation without adding a revocation service.

Proposed registration password rule to resolve an unspecified contract: at least 8 characters and one number, matching the login export's hint, with an explicit maximum of 72 UTF-8 bytes for bcrypt input. Confirm-password is frontend-only; never prefill passwords or show static strength claims. Login checks credentials without applying new registration composition rules to existing users.

Origin validation applies to all browser mutations, including login/register/logout. Match APP_ORIGIN exactly and reject missing/unexpected production origins. Use the Vite origin as the allowed development browser origin. Limit JSON body size and validate bodies, query parameters, and IDs with Zod. Never render feedback as raw HTML or log credentials.

Central api.js uses relative /api URLs, credentials, consistent error parsing, and AbortController/request sequencing to prevent stale search responses. AuthContext loads /auth/me once and distinguishes loading from unauthenticated. Preserve a safe internal return path through login. A failed mutation keeps form content and displays an error; success is shown only after the server confirms it.

Disable repeated vote clicks while pending, use returned counts/state, and refetch relevant views when needed. Refresh lists/rankings after voting, creation, and status changes; refetch on navigation rather than adding a global cache library. Other users' changes become visible on refresh; no WebSockets.

## Stitch mapping and reusable design

All paths below are relative to design/stitch_feedbackflow_feature_platform/; each screen has code.html and screen.png.

| Existing screen | React destination | Preserve and adapt |
| --- | --- | --- |
| feedback_board_homepage | FeedbackBoard at / | Header, hero, filters, card stack, vote controls, pagination, loading/empty patterns |
| feedback_details | FeedbackDetails at /feedback/:id | Main content/sidebar hierarchy, author/date/category/status, voting; plain description |
| public_product_roadmap | Roadmap at /roadmap | Four semantic lanes, compact cards, responsive status tabs |
| login_screen | Login at /login | Split brand/form layout, email/password and visibility control |
| registration_screen | Register at /register | Split layout, name/email/password/confirmation, validation |
| admin_dashboard | AdminDashboard at /admin | Summary cards, status distribution, paginated table and status selectors |
| submit_feedback_modal | Shared FeedbackForm within Modal | Title/category/description, live length counters, cancel/submit; no new route |

Share AppLayout/Navbar across public/admin screens, AuthLayout across auth screens, and one submission modal across entry points. Reuse StatusBadge, CategoryChip, VoteButton, FeedbackCard, SearchFilters, Pagination, FormField, LoadingSkeleton, EmptyState, ErrorMessage and accessible Modal. Implement header search as navigation to the actual board search; remove shortcut hints unless wired.

Use engineered_precision/DESIGN.md for semantic status/category colors, Geist text, JetBrains Mono metrics, 4px spacing rhythm, crisp borders, 4–6px controls, 8px cards and 12px modals. Resolve export radius aliases explicitly rather than copying its rounded-full=12px override. Preserve the existing screen-specific ink/indigo button hierarchy, dark split auth panels, spacing and composition. Use shared semantic tokens to resolve inconsistent aliases without redesigning the screens. Normalize the differing auth logos to the shared board logo.

At desktop widths use four roadmap lanes when 280px minimum widths fit, otherwise controlled horizontal overflow; tablet uses two columns; mobile uses accessible status tabs and one lane. Provide actual mobile navigation, not just hidden desktop links. Tables may scroll within their container. Modal focus stays inside, Escape closes, focus returns to trigger, background is inert, and short screens can scroll. Label controls, announce errors, preserve visible focus, and distinguish states with text as well as color.

## Development phases and milestones

| Phase | Milestones | Outcome |
| --- | --- | --- |
| Foundation | M1–M2 | Executable MERN structure, models and isolated test harness |
| Backend | M3–M6 | Secure, tested Express APIs backed by MongoDB |
| Frontend | M7–M9 | Existing Stitch visuals converted to working React journeys |
| Testing & Deployment | M10–M11 | Verified integration and production deployment |
| Documentation | M12 | Reproducible setup, evidence and delivery documentation |

The phases group the twelve detailed milestones; they do not add features. Commit checkpoints below are proposed focused commits after verification, not commits created during this planning turn.

Every milestone ends with its own verification and a focused review. Backend tests are written alongside behavior, not deferred to the final phase. Approval of this plan is required before starting M1.

### Phase 1 — Foundation

#### M1 — Repository and executable MERN foundation

**Files/tasks:** Create package.json, package-lock.json, .gitignore, .env.example, .nvmrc, eslint.config.js; client/package.json, index.html, vite.config.js, src/main.jsx, App.jsx, index.css; server/package.json, index.js, src/app.js, config/db.js, middleware/errorHandler.js.

**Verification:** npm run lint; npm run build; npm run dev (manual proxy/startup check).

**Git checkpoint:** `chore: scaffold MERN foundation` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Create root/client/server manifests, lockfile, ignores, environment example, Vite/Tailwind configuration, Express app/entry separation, database connection lifecycle, and base error handling. Keep secrets server-side. Define scripts for development, lint, server tests, client build and production start.

Acceptance: both development processes start; /api routing reaches Express through Vite; MongoDB connection failures are clear; React builds; importing app does not start a listener; secrets and generated output are ignored. Check installed dependency compatibility and record Node requirements.

Depends on: approval.

#### M2 — Models, indexes and isolated API test harness

**Files/tasks:** Create server/src/models/{User,Feedback,Vote}.js, tests/setup.js, tests/models.test.js, server/vitest.config.js and server/scripts/seedAdmin.js; update server/package.json and .env.example with test-only configuration.

**Verification:** npm test --workspace server -- models.test.js; manually verify safe test database guard and index initialization.

**Git checkpoint:** `feat: add MongoDB models and isolated tests` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Implement the three models and their indexes, validation constants, database test setup, and controlled admin seed script. Use a dedicated test URI/database with an explicit test database-name guard; refuse destructive cleanup against the development/production database. Await index creation before concurrency tests.

Acceptance: field/enumeration validation works; duplicate normalized emails and duplicate vote pairs are rejected by MongoDB; reference shapes match the architecture; test cleanup affects only the isolated test database; no admin password is committed or logged.

Depends on: M1.

### Phase 2 — Backend

#### M3 — Authentication and access boundaries

**Files/tasks:** Create server/src/controllers/authController.js, routes/authRoutes.js, middleware/{authenticate,optionalAuthenticate,authorizeAdmin,validate,verifyOrigin}.js, validators/authSchemas.js, utils/session.js and tests/auth.test.js; update app.js/errorHandler.js.

**Verification:** npm test --workspace server -- auth.test.js; npm run lint.

**Git checkpoint:** `feat: implement cookie authentication and authorization` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Implement auth routes/controller, password hashing, JWT cookie helpers, authentication/optional authentication, admin authorization, strict validation, Origin checks and safe error serialization.

Acceptance: registration/login/me/logout work with cookies; duplicate email returns 409; invalid/expired sessions return 401 on protected routes; regular users receive 403 on admin operations; role injection fails; no hashes leak; production cookie attributes and rejected cross-origin/missing-origin mutations are tested. Registration establishes a session immediately.

Depends on: M2.

#### M4 — Feedback creation, details and discovery

**Files/tasks:** Create server/src/controllers/feedbackController.js, services/feedbackService.js, routes/feedbackRoutes.js, validators/feedbackSchemas.js and tests/feedback.test.js; update app.js.

**Verification:** npm test --workspace server -- feedback.test.js; npm run lint.

**Git checkpoint:** `feat: add feedback creation and discovery APIs` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Implement creation, details, list filtering/search, both sort modes and pagination in feedbackController/feedbackService.

Acceptance: valid content persists with server-owned author/status; invalid lengths/enums/IDs and absent records produce expected responses; combined search/category/status returns correct totals; limit bounds work; deterministic sorting occurs before pagination. Seed more than one page in tests, including a high-vote item that would otherwise fall outside page one. Verify public author privacy and authenticated hasVoted.

Depends on: M3.

#### M5 — Voting and consistency

**Files/tasks:** Create server/src/controllers/voteController.js and tests/voting.test.js; update feedbackRoutes.js and feedbackService.js as needed.

**Verification:** npm test --workspace server -- voting.test.js feedback.test.js; npm run lint.

**Git checkpoint:** `feat: enforce persistent idempotent voting` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Implement PUT/DELETE vote endpoints with duplicate-safe upsert and authoritative counts. Handle duplicate-key races as successful idempotent creation.

Acceptance: repeated PUT/DELETE calls succeed; concurrent same-user PUTs create exactly one vote; different users can vote independently; deleting one's vote leaves others untouched; nonexistent feedback cannot receive votes; refreshed detail/list counts match persistence. Test database uniqueness, not just button disabling.

Depends on: M4.

#### M6 — Roadmap and admin backend

**Files/tasks:** Create server/src/controllers/{roadmapController,adminController}.js, routes/{roadmapRoutes,adminRoutes}.js and tests/{roadmap,admin}.test.js; update feedbackRoutes.js, feedbackService.js and app.js.

**Verification:** npm test --workspace server -- roadmap.test.js admin.test.js; npm run lint.

**Git checkpoint:** `feat: add roadmap and admin APIs` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Implement bounded roadmap groups, true group totals, admin statistics, and status updates. Reuse feedback list for admin management.

Acceptance: all four groups exist even when empty; no group exceeds 10 items; ranking and truncation metadata are correct; stats reflect actual records; valid status changes persist and appear on roadmap refresh; invalid status and unauthorized requests fail.

Depends on: M5.

### Phase 3 — Frontend

#### M7 — Shared React design foundation

**Files/tasks:** Create client/src/components/{layout,common,feedback,admin,roadmap}/ and six page components plus NotFound.jsx; update App.jsx/index.css and client build configuration. Keep design/ exports unchanged.

**Verification:** npm run lint; npm run build; npm run dev for keyboard and viewport review against all seven references.

**Git checkpoint:** `feat: build shared React UI from Stitch designs` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Implement routes, layouts, tokens, navigation, common components and accessible modal. Convert exports into React components; replace inline scripts and direct DOM mutation with React state/events. Preserve the source exports.

Acceptance: all six routes render their intended layouts; mobile navigation works; shared badges/buttons/forms match the design rules; modal keyboard/focus/scroll behavior works; responsive layouts remain usable at 375px, 768px, 1024px and a wide desktop size. Temporary development fixtures never become the production data source.

Depends on: M1. Can be reviewed independently of backend milestones.

#### M8 — Authentication and core user journeys in React

**Files/tasks:** Create client/src/services/api.js, context/AuthContext.jsx and hooks for data loading/voting; update Login.jsx, Register.jsx, FeedbackBoard.jsx, FeedbackDetails.jsx, FeedbackForm, VoteButton and routes.

**Verification:** npm test; npm run lint; npm run build; manually complete register → submit → vote → refresh → logout against real Express/MongoDB.

**Git checkpoint:** `feat: connect authentication and feedback journeys` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Implement api.js/AuthContext, login/register forms, safe redirects, board query parameters, details, shared submission and vote behavior. Connect to the real M3–M5 endpoints.

Acceptance: visitor browsing works; login returns to the intended page/action; submit creates visible Under Review feedback; board filters compose and reset pagination; refresh/back/forward preserve URL state; voting persists after reload; expired sessions and API/network failures show clear recoverable states. No simulated timers report success or localStorage substitutes for backend data.

Depends on: M5 and M7.

#### M9 — Roadmap and administrator UI

**Files/tasks:** Update client/src/pages/{Roadmap,AdminDashboard}.jsx, roadmap/admin components, protected route handling and API client methods.

**Verification:** npm test; npm run lint; npm run build; manually verify role rejection, status changes, roadmap refresh and truncated-group navigation.

**Git checkpoint:** `feat: connect roadmap and admin management` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Connect roadmap groups and “View all” navigation; connect admin metrics/table/status updates. Hide admin navigation from visitors/users and guard the route while relying on backend authorization.

Acceptance: empty/truncated groups are clearly represented; mobile tabs retain selection across viewport changes; admins update status with pending/error feedback; changed items and totals refresh correctly; regular users cannot access management data by direct URL or API call.

Depends on: M6 and M8.

### Phase 4 — Testing & Deployment

#### M10 — Integrated quality and regression review

**Files/tasks:** Add meaningful regression cases to server/src/tests/ and make focused fixes in affected server/client files; create docs/VERIFICATION.md with the PRD acceptance matrix.

**Verification:** npm test; npm run lint; npm run build; complete manual accessibility, responsive, network-failure and three-role workflow checks.

**Git checkpoint:** `test: verify MVP workflows and regression coverage` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Run all API tests and lint/build checks. Manually exercise all three PRD journeys with visitor, two regular users and admin accounts. Check invalid routes, missing records, rapid filter changes, refresh, logout, cookie expiry, keyboard use, small screens and failure recovery. Compare implemented pages against each reference image, accounting for documented scope removals.

Acceptance: PRD FR-01 through FR-09 each have recorded evidence; all critical backend tests pass; ranking and concurrency regressions are covered; no dead controls, hardcoded totals, fabricated success states or browser console errors remain. Record actual bugs, causes, focused fixes and rerun results.

Depends on: M9.

#### M11 — Production deployment and smoke verification

**Files/tasks:** Update server/src/app.js, server/index.js, root/server package scripts, .env.example and README deployment notes; create provider configuration only if required by the selected host.

**Verification:** npm ci; npm test; npm run lint; npm run build; npm start; manually run HTTPS production smoke checks.

**Git checkpoint:** `chore: prepare and verify single-origin deployment` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Configure Express to serve client/dist on the same origin, with API 404/error handling before the SPA fallback. Prepare the Node build/start flow, HTTPS cookie configuration, Atlas restricted database credentials, required indexes, environment validation and graceful shutdown. Record operational setup instructions as work proceeds so deployment does not depend on undocumented steps.

Verify the production build locally, then deploy to the user's selected Node host with MongoDB Atlas when the account, domain and environment configuration are available. The architecture specifies a deployment shape, not a vendor. Provider selection and any paid-resource approval are release prerequisites; never assume access or create paid resources silently. A missing release environment leaves the live-deployment task pending, while local preparation and documentation can continue.

Acceptance: production build/start works locally; direct refresh of /feedback/:id, /roadmap and /admin serves React; unknown /api paths return JSON rather than index.html. On the deployed HTTPS origin, verify registration/login/logout, submission, voting, search, admin updates and roadmap refresh; inspect cookie flags and Atlas indexes. Record the release revision and rollback procedure. Do not claim deployment completion until these live checks pass.

Depends on: M10; live release additionally depends on deployment environment availability.

### Phase 5 — Documentation

#### M12 — Reproducible documentation and delivery evidence

**Files/tasks:** Create/complete README.md and AI_DEVELOPMENT.md; update docs/VERIFICATION.md and docs/IMPLEMENTATION_PLAN.md to reflect real outcomes.

**Verification:** npm ci; npm test; npm run lint; npm run build using documented setup; git diff --check; manually verify links, secrets exclusion and evidence.

**Git checkpoint:** `docs: document setup verification and delivery` after this milestone meets its acceptance criteria. Review the diff and stage only related files; do not commit secrets, database artifacts or generated build output.

Complete README with install/dev/test/build/start instructions, required Node version, environment variable descriptions, API summary, architecture, admin setup, deployment/rollback instructions and known limitations. Complete AI_DEVELOPMENT.md with 3–5 real development/debugging examples captured during earlier milestones. Record PRD acceptance evidence in docs/VERIFICATION.md, including failures or checks still pending.

Review tracked files for secrets and prepare the public GitHub delivery required by the PRD. Record actual repository/deployment links; public publishing occurs only within release authorization. Reconcile the final implementation with this plan and document justified deviations.

Acceptance: fresh-clone instructions reproduce setup, test and production build; all P0 requirements map to actual verification results; examples and test outcomes are factual; documentation contains no credentials. Repository and live URLs are verified when published, and any pending delivery action is identified explicitly.

Depends on: M10 for test evidence and M11 for final deployment evidence. Documentation drafting can proceed throughout all phases.

## Inconsistencies, technical risks and planned treatment

| Finding in sources | Treatment |
| --- | --- |
| Architecture tree says designs/, checkout uses design/ | Keep existing design/; reference it consistently without moving exports. |
| Screens show comments, following, notifications, reactions, uploads, CSV export, deletion, priorities, sprint dates/progress, related suggestions, release history, OAuth/SSO and password recovery | Omit these controls/fields from MVP. Do not create extra collections/APIs. Preserve surrounding layout and spacing. |
| Registration/login promise AI clustering, integrations, certification, testimonials, hundreds of customers and deployment capabilities | Replace unsupported marketing claims with the three real MVP benefits. Remove fabricated compliance/service-status claims and placeholder legal/support links. |
| Modal says review occurs before public appearance; PRD says immediate Under Review creation | Show new feedback immediately with Under Review status; correct the copy. Remove local-autosave claim and attachment area. |
| Board/roadmap duplicate modal variants add urgency or target lane | Use one shared modal with only title, category, description; server owns initial status. |
| Detail screen uses structured solution/sketch sections and unrelated categories | Render the single plain-text description; retain only the four approved categories and supported metadata. |
| Admin search hints include author/category text; prototype supports ascending votes | Search only title/description, provide category as a filter, and use documented newest/most_voted sorts. Adjust labels to match behavior. |
| Export colors/radii/shadows differ from DESIGN.md; numeric font is declared but not explicitly loaded in reviewed HTML links | Centralize semantic tokens, explicitly load both fonts, apply written shape/border rules and visually verify. Avoid copying global scrollbar suppression. |
| Static scripts modify counts locally, fake login/submission, reverse cards for newest and filter DOM rows | Replace with real asynchronous requests, database results and server sorting/pagination. |
| Roadmap bounded groups could hide less popular items | Return totals/limit and link to status-filtered paginated board; never imply the preview is exhaustive. |
| Unique index (user, feedback) is not optimized for feedback-only counts | Add feedback-leading index; await creation and test concurrent writes. |
| Unanchored regex and most-voted aggregation grow costly with dataset size | Bound search/page sizes, escape search, match before aggregation, index vote lookups; accept small-dataset tradeoff without adding a search platform. |
| Count and mutation are separate operations under concurrent clients | Treat responses as server observations; serialize local toggles and refetch. Do not promise a globally frozen count or add counter transactions. |
| Cookie setup can break across origins; stale JWT roles can authorize incorrectly | Keep single origin, exact Origin checks, matched expiry/cookie clearing, and current database role checks. |
| Password policy, session lifetime and response envelopes are incomplete in specs | Proposed precise defaults appear above for approval; document and test them before integration. |
| Prototype desktop navigation disappears on mobile; modal screenshot is clipped | Implement mobile navigation and keyboard/viewport tests; use modal HTML plus design rules to verify the complete component. |
| PRD suggests a 72-hour window | Keep the small milestones and P0 scope; time estimates are not acceptance evidence. Reserve time for integration, tests and production checks. |

No comments, file uploads, AI features, workspaces, payments, advanced analytics, feedback editing/deletion, real-time infrastructure or automatic duplicate detection will be added.

## Verification of this planning deliverable

This turn changes only docs/IMPLEMENTATION_PLAN.md. Check the document against the two specifications, all seven UI mappings, model/API inventory, scope exclusions, milestone dependencies and acceptance criteria. No runtime tests are applicable to a Markdown-only plan, and none are claimed. Verify the saved file is nonempty and contains five phase headings, twelve milestone headings, and the requested files, dependencies, acceptance, verification and commit details.

### Planned verification command contract

These commands are future implementation requirements, not existing or executed checks. M1 creates the root workspace scripts; M2 adds the runnable test setup. Do not claim any command passed until it is actually run.

| Command (from repository root) | Required behavior |
| --- | --- |
| `npm ci` | Reproduce dependencies from the committed lockfile, after M1 creates it |
| `npm run dev` | Start Vite and Express for manual local journeys |
| `npm run lint` | Check maintained client and server source; exclude original design exports |
| `npm test` | Run server Vitest/Supertest suites once against the isolated test database |
| `npm test --workspace server -- auth.test.js` | Run a focused suite; other milestone commands use corresponding filenames |
| `npm run build` | Build the Vite client for production |
| `npm start` | Start Express with the built frontend; production environment is configured separately |
| `git diff --check` | Detect whitespace errors in tracked changes |

Configure MONGODB_TEST_URI through local test environment setup, never command-line secrets; tests must refuse unsafe database names. Production requires MONGODB_URI, JWT_SECRET, NODE_ENV, PORT and APP_ORIGIN. Document test-only variables separately.

Manual test matrix: visitor public browsing/search/detail/roadmap; regular-user authentication/submission/vote/unvote; second-user vote isolation; admin statistics/status updates; unauthorized API attempts; session expiry; malformed IDs and input; empty/error/loading states; keyboard focus; 375/768/1024/wide-desktop layouts; full matching-set vote ranking; deep-link refresh and deployed HTTPS cookie behavior. Record command, environment, outcome and relevant evidence in docs/VERIFICATION.md.

No automated frontend test framework is required for this small MVP; use the prescribed backend integration tests and documented browser workflow checks. Add a targeted automated regression only when its value warrants the maintenance cost.

### Git checkpoints and approval boundaries

First checkpoint after document approval: `docs: add FeedbackFlow implementation plan`. Each milestone lists a separate proposed commit message. Review the diff, run the milestone checks, then commit only that coherent completed change. Failed checks keep the milestone open; record skipped checks honestly. Do not automatically push, publish, deploy or start application implementation as a side effect of saving this plan.

Approval gate: review this plan and its proposed defaults before any application files, dependencies or database resources are created.

