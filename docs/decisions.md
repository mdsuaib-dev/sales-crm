# Sales CRM --- Architecture and Implementation Decisions

## 1. React + TypeScript + Vite

### Decision

Use React with TypeScript and Vite for the client.

### Reason

The stack is lightweight, fast for development, strongly typed, and
appropriate for a CRUD-heavy take-home CRM application.

### Trade-off

The current application state is concentrated in `App.tsx`, which has
become large. Further development should split the application into
feature-level components.

------------------------------------------------------------------------

## 2. Express + TypeScript

### Decision

Use Express 5 with TypeScript for the API.

### Reason

It provides a small, explicit REST-style server suitable for the
assignment without introducing unnecessary framework complexity.

### Trade-off

As more features are added, a single route file becomes harder to
maintain. The collaborator feature therefore begins the move toward
separate feature modules.

------------------------------------------------------------------------

## 3. PostgreSQL + Prisma

### Decision

Use PostgreSQL with Prisma 7.

### Reason

The assignment has relational data and requires relationships between
users, companies and deals. PostgreSQL provides appropriate relational
integrity and Prisma provides typed database access and migrations.

------------------------------------------------------------------------

## 4. JWT Authentication

### Decision

Use JWT bearer authentication.

### Reason

The React frontend and Express API are separated, so a bearer token
provides a simple stateless authentication mechanism for API requests.

### Security requirement

The signing and verification operations use the same `JWT_SECRET`,
supplied through environment configuration.

Passwords are hashed with bcryptjs and are never intended to be returned
to the frontend.

------------------------------------------------------------------------

## 5. Role-Based Authorization

### Decision

Use explicit roles:

``` text
ADMIN
MANAGER
SALES
```

### Reason

The assignment requires different capabilities for managers and sales
representatives, with server-side enforcement.

### Important principle

Frontend controls are not treated as security boundaries. The backend
must reject unauthorized requests even if a user bypasses the React UI.

------------------------------------------------------------------------

## 6. Server-Side Search, Filtering and Pagination

### Decision

Perform primary deal/company search, filtering, sorting and pagination
in the API.

### Reason

The assignment explicitly requires server-side behavior and pagination
with a total count.

### Benefit

The client does not need to load the complete dataset merely to display
one page.

------------------------------------------------------------------------

## 7. Deal Lifecycle Rules on the Server

### Decision

Lifecycle validation is implemented in the backend.

### Reason

Stage transitions are business rules. A malicious or modified client
must not be able to skip stages or close/reopen deals illegally.

### Current rules

-   Forward movement is one stage.
-   Backward movement is one stage and requires a reason.
-   WON/LOST are closed.
-   Manager can reopen closed deals.

------------------------------------------------------------------------

## 8. Soft Archive for Companies

### Decision

Use:

``` text
isArchived = true
```

instead of deleting the company.

### Reason

The assignment explicitly says archiving should hide a company without
destroying its deals.

### Benefit

Historical deal relationships remain intact.

------------------------------------------------------------------------

## 9. Decimal Deal Values

### Decision

Use Prisma `Decimal` for deal values.

### Reason

Deal values are monetary amounts. Decimal storage avoids the
representation issues associated with binary floating-point values.

------------------------------------------------------------------------

## 10. Collaborator Join Table

### Decision

Represent deal collaborators using:

``` text
DealCollaborator
```

with:

``` text
dealId
userId
createdAt
```

and:

``` text
UNIQUE(dealId, userId)
```

### Reason

A deal has one owner but can have many additional sales representatives.
A join table models this naturally without duplicating user/deal data.

### Permission decision

Only an Admin, Manager or deal owner can add/remove collaborators.

Collaborators can access and update a deal but cannot manage the
collaborator list unless they are also the owner/manager/admin.

------------------------------------------------------------------------

## 11. Safe User Selection

### Decision

Do not return the complete User record when a deal response only needs
owner information.

### Reason

The User model contains `passwordHash`. Broad relation inclusion creates
unnecessary exposure risk.

### Implementation

Deal owner responses use a restricted `select` containing non-sensitive
fields such as:

``` text
id
name
email
role
isActive
```

------------------------------------------------------------------------

## 12. Environment-Based API URL

### Decision

The frontend uses:

``` ts
import.meta.env.VITE_API_URL || "http://localhost:5000/api"
```

### Reason

Local development needs a convenient default, while production needs a
configurable backend URL.

------------------------------------------------------------------------

## 13. Prisma 7 Configuration

### Decision

Use a dedicated Prisma 7 configuration file:

``` text
server/prisma.config.ts
```

with environment-based datasource configuration.

### Reason

Prisma 7 separates configuration concerns and supports explicit
migration/seed configuration.

------------------------------------------------------------------------

## 14. Feature Additivity

### Decision

New functionality should be added as separate feature files where
practical rather than replacing the existing project.

### Example

Collaborator UI is isolated in:

``` text
client/src/features/DealCollaboratorsPanel.tsx
```

and backend collaborator handlers are in:

``` text
server/src/features/dealCollaborators.ts
```

### Reason

This reduced the risk of breaking existing CRUD and lifecycle
functionality.

------------------------------------------------------------------------

## 15. Current Dashboard Approach

### Decision

The current dashboard calculates basic headline/pipeline values from
deal data already available to the React application.

### Reason

This was sufficient for the initial dashboard/pipeline UI.

### Limitation

The full assignment requires server-side analytics and weighted pipeline
calculations. That should be implemented as dedicated API aggregation
rather than scaling the current client-side approach.

------------------------------------------------------------------------

## 16. Immutable History --- Deferred Decision

### Current state

The current model stores `previousStage` and `stageChangeReason`.

### Why this is not considered a complete history solution

Those fields describe current deal state; they do not provide an
append-only record of every event and actor.

### Future decision

Use a dedicated append-only history/event table when implementing the
complete timeline requirement.

------------------------------------------------------------------------

## 17. AI-Assisted Development

AI assistance was used as a development aid for:

-   Architecture planning
-   Code generation
-   Debugging
-   Security review
-   Prisma/schema design
-   API design
-   React integration
-   Documentation
-   Requirement-gap analysis

AI output was treated as a proposal and verified against the actual
source code, API behavior, database schema and assignment requirements.

This is particularly important because some generated suggestions
required correction before being applied.

------------------------------------------------------------------------

## 18. Decision: Do Not Claim Unimplemented Features

### Decision

Documentation explicitly distinguishes implemented features from
remaining requirements.

### Reason

The assignment is evaluated against actual functionality. Claiming that
history, bulk actions, CSV export or alerts are implemented when they
are not would make the documentation inaccurate.

------------------------------------------------------------------------

## 19. Future Refactoring Boundary

If the project continues beyond the take-home assignment:

-   Split `App.tsx` into feature components.
-   Split `index.ts` into routes/controllers/services.
-   Add request validation schemas.
-   Add centralized error handling.
-   Add automated unit/integration tests.
-   Add structured logging.
-   Add database indexes based on real query patterns.
