# Sales CRM --- Architecture

## 1. Purpose

This document describes the architecture of the Sales CRM take-home
assignment as implemented to date. It reflects the current application
rather than an idealized future architecture.

The application is a full-stack sales pipeline management system with
authentication, role-based access, company and deal management, deal
lifecycle rules, server-side search/filtering/pagination, company
archiving, and deal collaborators.

Features that have not yet been implemented are explicitly identified as
such.

------------------------------------------------------------------------

## 2. Technology Stack

  Layer              Technology
  ------------------ --------------------------------
  Frontend           React 19 + TypeScript
  Build tool         Vite
  Backend            Express 5 + TypeScript
  ORM                Prisma 7
  Database           PostgreSQL
  Authentication     JWT
  Password hashing   bcryptjs
  API style          JSON REST-style HTTP endpoints
  Development        Vite + tsx
  Configuration      Environment variables

The repository is split into a React client and Express/Prisma server.

``` text
sales-crm/
├── client/
│   └── src/
│       ├── App.tsx
│       ├── features/
│       │   └── DealCollaboratorsPanel.tsx
│       └── ...
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── prisma.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   └── features/
│   │       └── dealCollaborators.ts
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/
│       └── seed.ts
└── docs/
```

The API implementation is currently concentrated in
`server/src/index.ts`. The collaborator endpoints were separated into
`server/src/features/dealCollaborators.ts`.

------------------------------------------------------------------------

## 3. High-Level Architecture

``` text
                         ┌──────────────────────┐
                         │      Browser         │
                         │ React + TypeScript   │
                         │        + Vite        │
                         └──────────┬───────────┘
                                    │
                         HTTP/JSON + Bearer JWT
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Express API      │
                         │  TypeScript/Express  │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
           Authentication     Business Rules     Feature Routes
             Middleware       / Permissions      Collaborators
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │   Prisma 7  │
                             └──────┬──────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │ PostgreSQL  │
                             └─────────────┘
```

------------------------------------------------------------------------

## 4. Authentication Flow

Login is handled by the Express API.

``` text
User enters email/password
        |
        v
POST /api/login
        |
        v
Find user by email
        |
        v
bcrypt password comparison
        |
        v
JWT signed with JWT_SECRET
        |
        v
Frontend stores:
  salescrm_token
  salescrm_user
        |
        v
Subsequent API request:
Authorization: Bearer <JWT>
        |
        v
authenticate middleware
        |
        +--> invalid/missing token -> HTTP 401
        |
        v
req.user = { id, role }
        |
        v
Protected route
```

The JWT contains the authenticated user's ID and role.

The frontend's current helper reads the token from local storage and
attaches it to protected requests.

------------------------------------------------------------------------

## 5. Authorization Model

The application currently uses three roles:

-   `ADMIN`
-   `MANAGER`
-   `SALES`

There are two levels of authorization:

### Authentication

`authenticate` verifies that a valid JWT is present.

### Role authorization

`authorize(...)` checks whether the authenticated role is allowed to
access a route.

### Deal-level authorization

Deals also use ownership/collaboration checks.

For sales representatives, the deal list is scoped to deals where the
user is:

-   the owner, or
-   a collaborator.

A sales representative who is neither owner nor collaborator cannot
retrieve another user's deal and cannot update it.

Collaborator management is available to:

-   Admin
-   Manager
-   Deal owner

Only active sales representatives can be added as collaborators, and the
deal owner cannot be added as their own collaborator.

------------------------------------------------------------------------

## 6. Company Architecture

Company operations are exposed through Express endpoints and persisted
with Prisma.

Implemented behavior includes:

-   Active company listing
-   Server-side search
-   Server-side sorting
-   Server-side pagination
-   Company creation
-   Company editing
-   Company archiving
-   Company restoration
-   Archived-company listing

Archiving uses the `isArchived` flag rather than destroying the company
row. This preserves the relationship between a company and its deals.

A final permission audit is still required because the assignment
expects sales representatives as well as managers to be able to create
companies.

------------------------------------------------------------------------

## 7. Deal Architecture

Each deal has:

-   One company
-   One owner
-   Optional collaborators
-   Title
-   Value
-   Stage
-   Expected close date
-   Description
-   Requirements

The deal API supports:

-   Create
-   Read
-   List
-   Update
-   Delete
-   Search
-   Filtering
-   Sorting
-   Pagination
-   Lifecycle validation
-   Manager reopening
-   Collaborator management

The deal list applies search/filter/sort/pagination on the server rather
than relying on client-side filtering for the main dataset.

------------------------------------------------------------------------

## 8. Deal Lifecycle

The lifecycle is:

``` text
NEW
  ↓
QUALIFIED
  ↓
PROPOSAL
  ↓
NEGOTIATION
  ↓
WON / LOST
```

The server enforces the business rules.

Current implementation includes:

-   Forward movement by exactly one stage.
-   No stage skipping.
-   Backward movement by exactly one stage.
-   Backward movement requires a reason.
-   WON and LOST are closing states.
-   Closed deals cannot be changed through the normal update route.
-   Managers can reopen a closed deal.
-   Reopening returns the deal to the stored previous stage.

The current Deal model stores `previousStage` and `stageChangeReason`.

A full immutable event/history model has not yet been added.

------------------------------------------------------------------------

## 9. Collaborator Architecture

The collaborator feature was added without replacing the existing deal
model.

The database uses a many-to-many join model:

``` text
User 1 ────── N DealCollaborator N ────── 1 Deal
```

API endpoints:

``` text
GET    /api/deals/:id/collaborators
POST   /api/deals/:id/collaborators
DELETE /api/deals/:id/collaborators/:userId
```

The React UI is implemented as:

``` text
client/src/features/DealCollaboratorsPanel.tsx
```

It is rendered when a deal is being edited.

The panel supports:

-   Viewing collaborators
-   Adding an active sales representative
-   Removing a collaborator
-   Permission-aware controls
-   Duplicate prevention through backend validation

The backend performs the actual authorization. The frontend only
controls visibility and usability of the controls.

------------------------------------------------------------------------

## 10. Data Access and API Flow

Example deal-list request:

``` text
React
  |
  | GET /api/deals
  | ?search=website
  | &stage=PROPOSAL
  | &companyId=1
  | &ownerId=3
  | &sortBy=value
  | &order=desc
  | &page=1
  | &limit=10
  v
Express
  |
  | authenticate
  | authorization/scope
  | validate query parameters
  | construct Prisma where/orderBy
  v
Prisma
  |
  +--> count()
  |
  +--> findMany()
  |
  v
PostgreSQL
  |
  v
JSON response
{
  deals,
  total,
  page,
  limit,
  totalPages
}
```

This design keeps pagination and primary list filtering on the server.

------------------------------------------------------------------------

## 11. Dashboard Architecture --- Current State

The current dashboard is implemented in `client/src/App.tsx`.

It currently displays:

-   Total companies
-   Total deals
-   Pipeline value
-   Won deal count
-   Deals grouped by pipeline stage
-   Stage counts and values
-   Recent deals

The current dashboard uses deal data already fetched by the application
and calculates several values in React.

The assignment's complete dashboard requirement additionally calls for:

-   Open deals headline
-   Weighted pipeline value
-   Won this month
-   Lost this month
-   Open deals by stage and owner
-   Wins per week for the last eight weeks

A dedicated server-side analytics implementation for all of those
metrics is not yet integrated.

------------------------------------------------------------------------

## 12. Security Considerations

Implemented controls include:

-   Password hashing with bcryptjs
-   JWT authentication
-   Role-based authorization
-   Deal-level ownership/collaborator checks
-   Safe user selection for deal owner data so password hashes are not
    returned
-   Backend validation of lifecycle rules
-   Duplicate collaborator protection
-   Active-sales-user validation for collaborators

During development, an unsafe broad owner relation selection was
identified and replaced with a restricted selection containing
non-sensitive user fields.

A final route-by-route security audit remains advisable before
submission.

------------------------------------------------------------------------

## 13. Deployment Configuration

The project was prepared for deployment using environment-based
configuration.

The frontend uses:

``` ts
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

The backend uses environment variables for secrets and database
configuration.

The Prisma 7 configuration is maintained in:

``` text
server/prisma.config.ts
```

rather than embedding a production database URL in source code.

Production deployment should always provide:

``` text
DATABASE_URL
JWT_SECRET
```

through the hosting provider's environment configuration.

------------------------------------------------------------------------

## 14. Scalability Considerations

At larger data volumes, the following areas would need optimization:

1.  Indexes on frequently filtered/sorted deal fields.
2.  Indexes for `stage`, `ownerId`, `companyId`, and
    `expectedCloseDate`.
3.  Avoiding broad `all=true` queries for large datasets.
4.  Database-side dashboard aggregations.
5.  Separation of controllers/services from the current large
    `index.ts`.
6.  Strong request DTO validation.
7.  More structured error handling and observability.
8.  Automated tests for permission and lifecycle matrices.

The current architecture is intentionally simple and suitable for a
time-boxed take-home assignment.

------------------------------------------------------------------------

## 15. Current Implementation Boundary

Implemented to date:

-   React frontend
-   Express backend
-   PostgreSQL + Prisma
-   JWT authentication
-   Role authorization
-   Companies CRUD
-   Company archive/restore
-   Deals CRUD
-   Deal search/filter/sort/pagination
-   Deal lifecycle rules
-   Manager reopen
-   Deal collaborators
-   Collaborator-aware sales access
-   Dashboard/pipeline UI

Not yet implemented or not fully integrated:

-   Immutable timeline/history
-   Bulk owner reassignment
-   Bulk stage advancement with per-deal results
-   CSV export
-   Past-due alerts with dismissal/reappearance logic
-   Complete server-side dashboard analytics
-   Full permission alignment for sales-rep company/deal creation
-   Final automated test suite
