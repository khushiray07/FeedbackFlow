# FeedbackFlow
## System Architecture & Engineering Design

**Version:** 1.0  
**Status:** Implementation specification  
**Architecture style:** Modular Monolith  
**Required stack:** MongoDB, Express.js, React.js, Node.js  
**Development tool:** CodeZero + Codex  
**Product specification:** docs/PRD.md

---

## 1. Architecture Overview

FeedbackFlow uses a three-layer MERN architecture:

**Presentation Layer — React**

Responsible for user interaction, navigation, rendering data, forms, and API calls.

**Application Layer — Node.js + Express**

Responsible for routing, authentication, authorization, validation, business logic, and HTTP responses.

**Data Layer — MongoDB + Mongoose**

Responsible for persistent storage, relationships, indexes, and querying.

### Application Flow

User → React → REST API → Express → Controller/Service → Mongoose → MongoDB

Responses flow back through the same layers.

### Architectural Decision

Use a modular monolith, not microservices.

**Why?**

The assignment is small and time-limited. A modular monolith provides clear separation of responsibilities without unnecessary deployment and communication complexity.

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| HTTP client | Native Fetch API |
| Backend runtime | Node.js LTS |
| Backend framework | Express.js |
| Database | MongoDB Atlas |
| Object modeling | Mongoose |
| Password hashing | bcryptjs |
| Authentication | jsonwebtoken + HttpOnly cookies |
| Validation | Zod |
| Backend testing | Vitest + Supertest |
| UI reference | Existing Stitch designs |
| AI development | CodeZero + Codex |

The required MERN technologies must implement all core functionality.

Do not replace Express with Next.js API routes or MongoDB with PostgreSQL, Firebase, or browser localStorage.

## 3. Repository Structure

feedbackflow-mern/

    docs/
        PRD.md
        ARCHITECTURE.md
        IMPLEMENTATION_PLAN.md

    designs/
        Stitch-generated assets or exported screens

    client/
        src/
            components/
                layout/
                feedback/
                common/
            pages/
                FeedbackBoard.jsx
                FeedbackDetails.jsx
                Roadmap.jsx
                AdminDashboard.jsx
                Login.jsx
                Register.jsx
            context/
                AuthContext.jsx
            hooks/
            services/
                api.js
            App.jsx
            main.jsx
            index.css
        package.json

    server/
        src/
            config/
                db.js
            models/
                User.js
                Feedback.js
                Vote.js
            controllers/
                authController.js
                feedbackController.js
                voteController.js
                adminController.js
            services/
                feedbackService.js
            routes/
                authRoutes.js
                feedbackRoutes.js
                adminRoutes.js
            middleware/
                authenticate.js
                authorizeAdmin.js
                validate.js
                errorHandler.js
                verifyOrigin.js
            validators/
                authSchemas.js
                feedbackSchemas.js
            utils/
            tests/
            app.js
        scripts/
            seedAdmin.js
        index.js
        package.json

    AGENTS.md
    README.md
    AI_DEVELOPMENT.md
    .env.example
    .gitignore
    package.json

File names can be adjusted if the existing Stitch code uses different conventions. Preserve working code where possible.

## 4. Frontend Architecture

### Component Strategy

Use reusable components rather than writing all page functionality in a single file.

Main components:

- AppLayout
- Navbar
- FeedbackCard
- FeedbackForm
- VoteButton
- StatusBadge
- SearchFilters
- Pagination
- LoadingSkeleton
- EmptyState
- ErrorMessage

### Page Responsibilities

**FeedbackBoard**

- Fetch paginated feedback.
- Manage search and filter state.
- Render feedback cards.
- Open submission modal.
- Handle loading, empty, and error states.

**FeedbackDetails**

- Read feedback ID from route.
- Fetch individual feedback.
- Show complete details.
- Support voting.

**Roadmap**

- Fetch public feedback grouped by status.
- Display four roadmap sections.
- Navigate to feedback details.

**Login / Register**

- Validate form inputs.
- Send authentication requests.
- Display server errors.
- Refresh session state after successful login.

**AdminDashboard**

- Display statistics.
- Display feedback management table.
- Update feedback status.
- Restrict UI access to admin users.

### State Management

Use:

- Local React state for forms, modals, and visual controls.
- URL query parameters for feedback search, filter, sort, and pagination.
- React Context for authenticated user information.
- Server responses as the source of truth for votes and feedback.

Avoid Redux for this small MVP.

### API Communication

Create a centralized API client.

All requests should use a shared base URL or relative /api paths.

For cookie-based authentication, use the appropriate Fetch credentials configuration.

Handle network errors, non-2xx responses, and loading states consistently.

Do not duplicate API endpoints throughout React components.

### Stitch Design Integration

The existing Stitch-generated screens define the visual design.

Before implementing or replacing frontend code:

1. Inspect the Stitch files.
2. Identify reusable layouts and components.
3. Extract shared colors, spacing, typography, and design patterns.
4. Map each design to the corresponding route.
5. Preserve the intended UI while connecting real application logic.
6. Adjust unsupported or nonfunctional elements only where necessary.
7. Make layouts responsive.

Do not blindly overwrite a functional React component solely to reproduce static HTML.

## 5. MongoDB Data Model

Use three collections:

- users
- feedback
- votes

Mongoose schemas enforce field types and document-level validation.

### 5.1 User Schema

Fields:

- _id: ObjectId
- name: String, required, 2–80 characters
- email: String, required, normalized lowercase
- passwordHash: String, required
- role: String, user or admin, default user
- createdAt: Date
- updatedAt: Date

Indexes:

- Unique index on email

Security rules:

- Never return passwordHash in normal API responses.
- Public registration always creates a regular user.
- Create admin accounts using a secure setup script or controlled configuration.
- Never accept a role supplied by the registration form.

### 5.2 Feedback Schema

Fields:

- _id: ObjectId
- title: String, required, 5–100 characters
- description: String, required, 20–2000 characters
- category: String, enum
- status: String, enum, default under_review
- author: ObjectId reference to User
- createdAt: Date
- updatedAt: Date

Categories:

- feature
- improvement
- bug
- integration

Statuses:

- under_review
- planned
- in_progress
- completed

Indexes:

- createdAt descending
- status + createdAt
- category + createdAt

Creation rules:

- The backend derives author from authentication.
- The backend sets the initial status.
- Regular users cannot override status or author.
- Feedback content is rendered as plain text, not executable HTML.

### 5.3 Vote Schema

Fields:

- _id: ObjectId
- user: ObjectId reference to User
- feedback: ObjectId reference to Feedback
- createdAt: Date

Compound unique index:

    voteSchema.index(
      { user: 1, feedback: 1 },
      { unique: true }
    );

This ensures that the same user cannot create two votes for the same feedback.

### Relationships

User 1 → N Feedback

User 1 → N Votes

Feedback 1 → N Votes

Votes represent the many-to-many relationship between users and feedback.

### Why a Separate Votes Collection?

It makes voting rules easy to enforce and avoids storing an unbounded array of voters inside each feedback document.

It also supports accurate vote queries and testing.

## 6. API Design

Base URL: /api

### Authentication Endpoints

**POST /api/auth/register**

Request:

    {
      "name": "Demo User",
      "email": "demo@example.com",
      "password": "example-password"
    }

Response:

    {
      "user": {
        "id": "user_id",
        "name": "Demo User",
        "email": "demo@example.com",
        "role": "user"
      }
    }

Creates the user and establishes an authenticated session.

**POST /api/auth/login**

Accepts email and password.

Verifies the password and establishes an authenticated session.

**POST /api/auth/logout**

Clears the authentication cookie.

**GET /api/auth/me**

Returns the current user or HTTP 401 if unauthenticated.

### Feedback Endpoints

**GET /api/feedback**

Query parameters:

- page (default 1)
- limit (default 10, maximum 50)
- search (optional, maximum 100 characters)
- category (optional)
- status (optional)
- sort (newest or most_voted)

Example:

    /api/feedback?page=1&limit=10&sort=most_voted

Response:

    {
      "data": [],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalItems": 0,
        "totalPages": 0
      }
    }

Each returned item includes author display information, voteCount, and the current user's hasVoted state when authenticated.

**GET /api/feedback/:id**

Returns a single feedback record with author, vote count, and voting state.

**POST /api/feedback**

Requires authentication.

Request:

    {
      "title": "Add dark mode",
      "description": "Support a dark color theme across the dashboard.",
      "category": "feature"
    }

The server validates data and creates feedback with the authenticated user as author.

### Voting Endpoints

**PUT /api/feedback/:id/vote**

Requires authentication.

Creates a vote relationship if one does not exist.

Repeated PUT calls must be safe.

Response:

    {
      "hasVoted": true,
      "voteCount": 42
    }

**DELETE /api/feedback/:id/vote**

Requires authentication.

Removes the user's vote if present.

Response:

    {
      "hasVoted": false,
      "voteCount": 41
    }

### Roadmap Endpoint

**GET /api/roadmap**

Public endpoint.

Returns feedback grouped by the four allowed statuses. For the MVP, each group may return a bounded number of items, sorted by vote count, with a clear limit documented in the response.

This endpoint must not download an unlimited collection.

### Admin Endpoints

**GET /api/admin/stats**

Admin-only.

Response includes:

- totalFeedback
- totalVotes
- underReview
- planned
- inProgress
- completed

**PATCH /api/feedback/:id/status**

Admin-only.

Request:

    {
      "status": "planned"
    }

Validates that the status belongs to the supported enum.

Successful updates persist to MongoDB.

## 7. Backend Request Lifecycle

Every request follows this flow:

1. Express receives the HTTP request.
2. Global middleware handles JSON parsing and cookies.
3. Write requests are checked for an allowed Origin when cookie authentication is in use.
4. Route-level middleware validates inputs.
5. Protected routes authenticate the session.
6. Admin routes verify user permissions.
7. Controller calls Mongoose models or service functions.
8. MongoDB executes the query.
9. Controller returns a structured response.
10. Global error handler processes unexpected errors.

Use consistent API error responses:

    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Please check the submitted fields."
      }
    }

Do not expose stack traces, password hashes, database URLs, or sensitive internals.

## 8. Feedback Search and Pagination

The backend must perform searching, filtering, sorting, and pagination.

Never load all records into React and paginate only in the browser.

### Newest Sorting

For requests sorted by newest:

1. Validate query parameters.
2. Construct category and status filters.
3. Apply escaped, case-insensitive keyword search when provided.
4. Count matching documents.
5. Sort by createdAt descending and _id descending.
6. Apply skip and limit.
7. Retrieve vote counts for the returned page only.
8. Include authenticated-user vote state.

This avoids counting votes across unrelated records for the common newest-sort query.

### Most-Voted Sorting

For most-voted requests:

1. Apply category, status, and search filters.
2. Use a MongoDB aggregation with a lookup/count of related votes.
3. Sort by vote count descending.
4. Use createdAt and _id as tie-breakers.
5. Apply pagination after sorting.
6. Return matching-record totals.
7. Include current-user vote state.

Do not paginate before calculating vote totals, because this would produce incorrect global rankings.

### Search Strategy

For this MVP, use a bounded, escaped, case-insensitive regular-expression search over title and description.

Limit the query length and page size.

This approach is acceptable for a small assessment dataset, although it is not intended as a large-scale search solution.

MongoDB Atlas Search may be considered in a future version.

## 9. Voting Consistency

### Key Requirement

Duplicate votes must never be created.

### Vote Creation

1. Validate feedback ID.
2. Confirm feedback exists.
3. Verify authenticated user.
4. Attempt an idempotent vote insert using an upsert or duplicate-safe insert.
5. Rely on the unique compound index for concurrency safety.
6. Retrieve the authoritative vote count.
7. Return hasVoted=true.

The implementation must handle duplicate-key races safely.

### Vote Removal

1. Validate feedback ID.
2. Confirm feedback exists.
3. Verify authenticated user.
4. Delete the vote matching user and feedback.
5. Recalculate the authoritative count.
6. Return hasVoted=false.

### Concurrency

Two simultaneous vote-creation requests for the same user and feedback must result in at most one vote document.

Automated tests should verify this behavior.

### Tradeoff

Recalculating vote totals adds database query work but avoids maintaining a separate counter that could become inconsistent.

This is an acceptable MVP tradeoff.

## 10. Authentication and Security

### Passwords

Use bcryptjs to hash passwords before saving users.

Do not log credentials.

Do not return password hashes through the API.

### Sessions

Use signed JWT authentication stored in an HttpOnly cookie.

Recommended cookie settings:

- HttpOnly: true
- Secure: true in production over HTTPS
- SameSite: Lax for a same-site application
- Path: /
- Short, documented expiration

Authentication middleware verifies token validity and identifies the current user.

The backend must never trust a role sent by the browser.

### CSRF Protection

Because cookies are automatically included in browser requests, protect state-changing endpoints against cross-site request forgery.

Use strict allowed-Origin validation and appropriate SameSite cookie settings. Reject unexpected or missing origins for browser mutation requests in production.

### Authorization

Protected routes require authentication.

Admin endpoints require the current database user's role to be admin.

The frontend may hide admin controls, but backend checks are mandatory.

### Input Security

- Validate request bodies using Zod.
- Validate MongoDB ObjectIds.
- Reject unsupported enum values.
- Apply input length limits.
- Reject unexpected fields where appropriate.
- Avoid rendering arbitrary user-supplied HTML.
- Limit JSON request body size.

### Operational Security

- Keep MongoDB credentials in environment variables.
- Use a restricted database user.
- Never commit .env files.
- Do not expose secret values in frontend bundles.
- Disable detailed stack traces in production.
- Do not include production credentials in tests.

## 11. Error Handling

Use centralized Express error middleware.

Expected responses:

| Code | Situation |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Validation or malformed request |
| 401 | Authentication required |
| 403 | Forbidden operation |
| 404 | Resource not found |
| 409 | Conflicting resource |
| 500 | Unexpected server error |

Duplicate vote requests handled idempotently should return success, not an unnecessary error.

## 12. Testing Architecture

Use Vitest and Supertest for backend API testing.

Keep API tests independent from production data.

Use a dedicated test MongoDB database or isolated MongoDB test instance.

### Priority Tests

**Authentication**

- Successful registration.
- Duplicate email.
- Successful login.
- Invalid password.
- Unauthenticated access.
- Normal user denied admin access.

**Feedback**

- Successful creation.
- Invalid title or description.
- Correct author assignment.
- Invalid feedback ID.
- Nonexistent feedback.
- Search and category filters.
- Combined filters and pagination.

**Voting**

- Add a vote.
- Repeat the same vote.
- Remove a vote.
- Repeat vote removal.
- Concurrent vote requests.
- Accurate most-voted sorting.

**Admin**

- Admin statistics.
- Successful status update.
- Invalid status rejection.
- Regular user denied status changes.

### Verification

After each milestone:

1. Run related tests.
2. Inspect failed cases.
3. Reproduce actual bugs.
4. Identify root causes.
5. Apply focused fixes.
6. Run regression tests.
7. Record the outcome.

Do not claim that tests passed unless they were actually executed successfully.

## 13. Deployment Architecture

Use MongoDB Atlas as the hosted database.

Preferred deployment:

- One Node.js application runs Express.
- Express serves the REST API.
- Express serves the built React frontend in production.
- MongoDB Atlas stores application data.

The frontend and backend share one public origin.

### Why Single-Origin Deployment?

- Simpler cookie handling.
- Fewer CORS issues.
- Easier deployment and debugging.
- Suitable for a small MERN assessment.

### Environment Variables

- MONGODB_URI
- JWT_SECRET
- NODE_ENV
- PORT
- APP_ORIGIN

Supply sample names in .env.example.

Never include real values.

### Production Checks

- React production build succeeds.
- Express starts correctly.
- Database connection succeeds.
- Refreshing frontend routes works.
- Authentication cookies work over HTTPS.
- All main APIs work with production configuration.
- No secrets are present in the public repository.

## 14. UI Engineering

The Stitch-generated screens are the visual source of truth.

Codex must first inspect:

- Existing UI source code
- Screen designs
- Images and icons
- Color palette
- Typography
- Layout patterns
- Responsive breakpoints

### Implementation Strategy

1. Identify shared visual components.
2. Create a reusable React layout.
3. Implement routes.
4. Convert static forms to controlled React forms.
5. Wire components to real APIs.
6. Handle all loading, error, and empty states.
7. Make interactive elements functional.
8. Check visual fidelity against Stitch designs.
9. Test mobile and desktop layouts.

Avoid unnecessary UI rewrites if usable React components already exist.

Avoid unrelated UI features outside the PRD.

## 15. Key Engineering Decisions

### Decision 1 — Modular Monolith

Provides maintainability without microservice complexity.

### Decision 2 — Dedicated Vote Model

Provides strong duplicate-vote protection using MongoDB indexes.

### Decision 3 — Backend Filtering and Pagination

Prevents unnecessary network transfer and demonstrates scalable API design.

### Decision 4 — Centralized Authentication

Keeps authorization consistent across all protected APIs.

### Decision 5 — Stitch-Based UI

Uses an existing design direction, saving development time while producing a consistent product.

### Decision 6 — API-First Implementation

Allows backend features to be tested before frontend integration.

### Decision 7 — Small, Testable AI-Assisted Tasks

Makes generated code easier to review, debug, and explain.

## 16. Implementation Order

### Milestone 1 — Foundation

- Review PRD, architecture, and Stitch screens.
- Create implementation plan.
- Set up repository and packages.
- Configure MongoDB.
- Implement Express application skeleton.

### Milestone 2 — Core Backend

- Create Mongoose models.
- Implement authentication.
- Implement feedback creation and retrieval.
- Add search, filtering, and pagination.
- Implement voting with unique constraints.
- Implement admin endpoints.

### Milestone 3 — Frontend

- Integrate Stitch design.
- Implement shared components.
- Add React routing.
- Connect authentication.
- Connect feedback APIs.
- Connect voting and search.
- Implement roadmap and admin dashboard.

### Milestone 4 — Quality

- Run API tests.
- Test core user flows.
- Fix real defects.
- Validate access control.
- Check responsiveness.
- Review generated code.

### Milestone 5 — Delivery

- Deploy.
- Verify production.
- Complete README.
- Document Code0 usage and debugging.
- Review GitHub commits.
- Submit repository link.

## 17. Definition of Done

The architecture is successfully implemented when:

- All required MERN technologies are used.
- Core features communicate with real backend APIs.
- Data persists in MongoDB.
- Authentication and authorization are enforced.
- Duplicate voting is prevented by MongoDB.
- Backend search and pagination return correct results.
- Stitch UI screens are integrated as functional React interfaces.
- Critical API tests pass.
- Documentation and public GitHub repository are ready.
- Major engineering choices can be explained clearly.

## 18. Development Constraints

- Keep the project within the defined MVP scope.
- Do not introduce unnecessary infrastructure.
- Do not add unrelated AI features.
- Do not use mock data as the final application backend.
- Do not silently change documented API behavior.
- Do not introduce features without checking against the PRD.
- Do not overwrite existing UI designs without reviewing them.
- Do not invent debugging stories or test results.
- Keep commits focused and meaningful.

**Architecture Goal:** Build a maintainable, secure, testable MERN application that solves a clear product problem and demonstrates independent engineering judgment.