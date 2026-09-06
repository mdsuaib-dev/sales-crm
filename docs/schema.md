# Sales CRM --- Database Schema

## 1. Database Technology

The application uses:

-   PostgreSQL as the relational database.
-   Prisma 7 as the ORM and schema/migration layer.

The current schema contains:

``` text
User
Company
Deal
DealCollaborator
```

------------------------------------------------------------------------

## 2. Entity Relationship Diagram

``` text
                 ┌──────────────┐
                 │     User     │
                 │──────────────│
                 │ id           │
                 │ name         │
                 │ email        │
                 │ passwordHash │
                 │ role         │
                 │ isActive     │
                 └──────┬───────┘
                        │
             owns       │
                        │
                        ▼
                 ┌──────────────┐
                 │     Deal     │
                 │──────────────│
                 │ id           │
                 │ title        │
                 │ value        │
                 │ stage        │
                 │ companyId    │
                 │ ownerId      │
                 │ previousStage│
                 │ stageReason  │
                 └──────┬───────┘
                        │
                  belongs to
                        │
                        ▼
                 ┌──────────────┐
                 │   Company    │
                 │──────────────│
                 │ id           │
                 │ name         │
                 │ website      │
                 │ email        │
                 │ industry     │
                 │ isArchived   │
                 └──────────────┘

User N ──────── N Deal
       through
  DealCollaborator
```

------------------------------------------------------------------------

## 3. User Model

  Field            Prisma type   Purpose
  ---------------- ------------- --------------------------------
  `id`             `Int`         Primary key
  `name`           `String`      User display name
  `email`          `String`      Unique login identifier
  `passwordHash`   `String`      Hashed password
  `role`           `String`      `ADMIN`, `MANAGER`, or `SALES`
  `isActive`       `Boolean`     Whether the account is active
  `createdAt`      `DateTime`    Creation timestamp
  `updatedAt`      `DateTime`    Last update timestamp

Constraints:

``` text
PRIMARY KEY (id)
UNIQUE (email)
```

Relationships:

``` text
User 1 ─── N Deal
User 1 ─── N DealCollaborator
```

------------------------------------------------------------------------

## 4. Company Model

  Field             Prisma type   Purpose
  ----------------- ------------- -------------------------
  `id`              `Int`         Primary key
  `name`            `String`      Company name
  `website`         `String?`     Optional website
  `email`           `String?`     Optional email
  `contactPerson`   `String?`     Optional contact
  `industry`        `String?`     Industry classification
  `isArchived`      `Boolean`     Soft-archive flag
  `createdAt`       `DateTime`    Creation timestamp
  `updatedAt`       `DateTime`    Last update timestamp

Relationship:

``` text
Company 1 ─── N Deal
```

Archiving does not destroy the company record or its deals.

------------------------------------------------------------------------

## 5. Deal Model

  -----------------------------------------------------------------------
  Field                   Prisma type             Purpose
  ----------------------- ----------------------- -----------------------
  `id`                    `Int`                   Primary key

  `title`                 `String`                Deal title

  `description`           `String?`               Optional description

  `requirements`          `String?`               Optional requirements

  `value`                 `Decimal?`              Deal monetary value

  `stage`                 `String`                Lifecycle stage

  `previousStage`         `String?`               Previous stage used by
                                                  lifecycle/reopen logic

  `stageChangeReason`     `String?`               Reason associated with
                                                  backward stage movement

  `expectedCloseDate`     `DateTime?`             Expected close date

  `companyId`             `Int`                   Company foreign key

  `ownerId`               `Int`                   User foreign key

  `createdAt`             `DateTime`              Creation timestamp

  `updatedAt`             `DateTime`              Last update timestamp
  -----------------------------------------------------------------------

Relationships:

``` text
Company 1 ─── N Deal
User    1 ─── N Deal
Deal    1 ─── N DealCollaborator
```

A deal therefore has exactly one company and exactly one owner.

------------------------------------------------------------------------

## 6. DealCollaborator Model

The assignment requires a deal to have one owner plus any number of
other sales representatives.

The implemented join table is:

  Field         Prisma type   Purpose
  ------------- ------------- --------------------------------------
  `id`          `Int`         Primary key
  `dealId`      `Int`         Deal foreign key
  `userId`      `Int`         Collaborating sales user foreign key
  `createdAt`   `DateTime`    Time collaboration was added

Relationships:

``` text
DealCollaborator N ─── 1 Deal
DealCollaborator N ─── 1 User
```

Constraint:

``` text
UNIQUE (dealId, userId)
```

Indexes:

``` text
INDEX (dealId)
INDEX (userId)
```

The unique constraint prevents duplicate collaborator assignments.

Foreign keys use cascade deletion so a deleted deal/user does not leave
orphaned collaborator rows.

------------------------------------------------------------------------

## 7. Lifecycle Values

Current deal stages are:

``` text
NEW
QUALIFIED
PROPOSAL
NEGOTIATION
WON
LOST
```

The lifecycle is enforced in application code rather than database CHECK
constraints.

Current behavior:

``` text
NEW -> QUALIFIED

QUALIFIED -> PROPOSAL
QUALIFIED -> NEW

PROPOSAL -> NEGOTIATION
PROPOSAL -> QUALIFIED

NEGOTIATION -> WON
NEGOTIATION -> LOST
NEGOTIATION -> PROPOSAL
```

Backward transitions require a reason.

WON and LOST are closed states.

------------------------------------------------------------------------

## 8. Database Rules vs Application Rules

### Database/schema responsibilities

-   Primary keys
-   Unique email
-   Unique collaborator pair
-   Foreign-key relationships
-   Required fields
-   Default values
-   Decimal storage for deal value
-   Automatic timestamps

### Application responsibilities

-   Valid role values
-   Valid deal stages
-   Lifecycle transition rules
-   Backward-move reason requirement
-   Closed-deal protection
-   Manager-only reopening
-   Deal ownership/collaboration access
-   Active-sales-user collaborator validation
-   Role-based permissions

------------------------------------------------------------------------

## 9. Migrations

The database has evolved through incremental Prisma migrations.

Relevant migrations include:

``` text
init
add_deal_lifecycle_fields
add_company_archive
add_deal_collaborators
```

The collaborator migration was added as:

``` text
20260906063403_add_deal_collaborators
```

The schema is therefore versioned rather than relying on manual
production database edits.

------------------------------------------------------------------------

## 10. Why `Decimal` Is Used for Deal Value

Deal value is stored as Prisma `Decimal` rather than a floating-point
database number.

This avoids relying on binary floating-point representation for monetary
values.

The frontend converts the value for display and request handling, while
the database retains decimal precision.

------------------------------------------------------------------------

## 11. Current Schema Limitation: Immutable History

The assignment requires an immutable timeline containing:

-   Creation
-   Every stage change
-   Old/new stage
-   Backward reason
-   Actor
-   Owner reassignment
-   Notes

The current schema does not yet contain a dedicated immutable
history/event table.

A future design should use an append-only model such as:

``` text
DealHistory
------------
id
dealId
eventType
actorId
oldStage
newStage
reason
oldOwnerId
newOwnerId
note
createdAt
```

History rows should be append-only and never updated/deleted through
normal application APIs.

This is documented as future work rather than represented as implemented
functionality.

------------------------------------------------------------------------

## 12. Future Indexing

As the dataset grows, likely indexes include:

``` text
Deal(stage)
Deal(ownerId)
Deal(companyId)
Deal(expectedCloseDate)
Deal(updatedAt)
DealCollaborator(dealId)
DealCollaborator(userId)
```

The exact index set should be driven by query plans and production usage
rather than added indiscriminately.
