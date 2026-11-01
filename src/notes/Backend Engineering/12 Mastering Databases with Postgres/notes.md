# My Notes: Mastering Databases with Postgres

> **Source:** "12. Mastering Databases with Postgres" by Sriniously, *Backend from first principles* playlist (YouTube, 2:45:25)
> **Link:** https://www.youtube.com/watch?v=F7Vwp2Xo5Do
>
> I wrote these from the video's full caption track, organised and worded my own way. The SQL is my own illustrative version of the schema and queries he describes (he uses **dbmate** for migrations and **TablePlus** as the GUI).

---

## 1. Why databases? Persistence

- Working with databases is one of the **most important and most frequent** things I'll do as a backend engineer.
- **Core purpose: persistence.** Storing data so it **survives after the program that created it stops**, across sessions, over time, even across physical locations.
- **Example, a to-do app:** I add items and tick some off. When I close and reopen the app, everything is in the **same state** I left it. Without persistence I'd start from scratch every time.

---

## 2. What counts as a "database"

The term is **very broad**. Any **structured storage** can count:
- My phone's **contact list**
- The browser's **localStorage / sessionStorage / cookies** (he opens DevTools → Application on Excalidraw and shows its key–value entries)
- Even a **plain text file** of notes

**The pattern:** a database is a **persistent system that offers create, read, update, delete (CRUD)**.

**In backend context**, "database" usually means **disk-based databases**: HDD, SSD, whatever modern storage.

---

## 3. Why disk-based (vs RAM)

```
              ┌──────┐
              │ CPU  │
              └──┬───┘
        ┌────────┴─────────┐
        ▼                  ▼
┌──────────────┐   ┌──────────────────┐
│ RAM (primary)│   │ Disk (secondary) │
│ very FAST    │   │ slower           │
│ expensive    │   │ cheap            │
│ 8–128 GB     │   │ 512 GB – 2 TB+   │
└──────────────┘   └──────────────────┘
   ▲ caches (Redis, in-memory)   ▲ databases (Postgres, MongoDB)
```

| | RAM | Disk |
|---|---|---|
| Speed | Very fast | Relatively slow (due to how data is stored and fetched) |
| Cost | Expensive | Cheap |
| Typical size | 8 / 16 / 32 GB (64–128 GB at the high end) | 512 GB – 2 TB |
| Used by | **Caching** (Redis, in-memory caches) | **Databases** (relational and non-relational) |

- Databases need **lots of space** and can **trade some speed** for it, so traditional DBs store data on **disk**.
- How DBs store data internally (algorithms, formats) is deep and out of scope. At the application level I just need to know: **caches use RAM, databases use disk.**

---

## 4. DBMS and its responsibilities

Storing data on disk isn't enough. I need efficient ways to **read, change, and delete** it at the scale of hundreds or thousands of GB. A **DBMS (Database Management System)** is software that **stores data and provides efficient CRUD**, plus security, scaling, load balancing, and more.

| Responsibility | Meaning |
|---|---|
| **Data organisation** | Organise data so CRUD stays efficient |
| **Access** | Provide create / read / update / delete methods |
| **Integrity** | Data is **accurate, valid, consistent**. E.g. an e-commerce `payment_amount` column must only accept **numbers**, so trying to store a string should **fail** |
| **Security** | Protect from unauthorised access via users and roles |

---

## 5. Why not just text files?

That's how people started, and it breaks down:

| Problem | Why |
|---|---|
| **Parsing** | To find one customer, my app code has to read the file, split lines, and compare fields. **Slow** (especially in JS/Python/Ruby vs Rust) and **error-prone**, so data can get corrupted or wrong |
| **No structure** | Can't enforce "this field is a number". Anything gets dumped in, so **no consistency** |
| **Concurrency** | Two people edit the same value at once and the **last write wins unpredictably** |

**Concurrency example:**
```
amount = 40
User A reads 40 ──► +20 ──► writes 60 ┐
User B reads 40 ──► −20 ──► writes 20 ┘ final value: 60 OR 20, depends on timing
```
A DBMS has **concurrency control** to give a consistent result. A text file can't.

---

## 6. Relational vs non-relational

| | **Relational (SQL)** | **Non-relational (NoSQL)** |
|---|---|---|
| Structure | **Tables, rows, columns**. Relationships via **foreign keys** | e.g. MongoDB: **collections** of **documents** |
| Schema | **Predefined, strict**: all columns and types decided up front | **Flexible**: each document can have a different structure |
| Strength | **Data integrity**: I can always rely on the data's state | **Speed of iteration**: prototype fast, push any shape |
| Weakness | Less flexible | Integrity must be enforced in **app code**, which adds complexity and is **error-prone** (app code changes often, so bugs creep in) |
| Language | **SQL** | DB-specific APIs |
| Examples | **MySQL, PostgreSQL, SQL Server**, SQLite | **MongoDB**, DynamoDB |

```
Relational:  table "users"           NoSQL: collection "users"
  ┌────┬───────┬──────────┐            { "_id": 1, "name": "A" }
  │ id │ name  │ email    │            { "_id": 2, "name": "B", "tags": ["x"] }
  ├────┼───────┼──────────┤            { "_id": 3, "nick": "C", "age": 30 }
  │ 1  │ A     │ a@x.com  │            ← each document can differ
  │ 2  │ B     │ b@x.com  │
  └────┴───────┴──────────┘  ← every row has the same shape
```

**Use-case examples:**
- **CRM (customer relationship management):** accurate, consistent data about contacts and sales opportunities, plus complex queries and relationship analysis → **relational (Postgres)**.
- **CMS (content management system, e.g. Sanity):** blog content mixing text, images, code blocks, YouTube embeds, with no fixed shape known ahead of time → **non-relational (MongoDB)** makes sense.

---

## 7. Why Postgres

MySQL, Postgres, SQLite, SQL Server all offer similar features and all scale. **Postgres is the sensible default:**

1. **Open source and free:** not proprietary. Companies can self-host and inspect it.
2. **SQL-standard compliant:** standard SQL runs the same way as on MySQL/SQL Server, so **migrating** later is easy if my queries and migrations stay standard.
3. **Very extensible:** the docs run to roughly 1,400 pages, covering almost any SaaS need, plus an **extension system**.
4. **Reliable and scalable.**
5. **Excellent JSON support** (the clincher): a JSON type with good **indexing and querying**. So I **don't need MongoDB just for dynamic data**. Store the dynamic part (e.g. CMS-style content) in a JSON column.

- Benchmarks claiming MySQL is faster rarely matter **until millions of users** and a specific bottleneck.
- Postgres is the first choice for many startups and big companies, and **should be mine for most projects**.

---

## 8. Prerequisite: SQL basics

- **SQL** = the query language. **Postgres** = the DBMS that runs it.
- There are tons of free courses (1–20 hours) on SQL and Postgres basics: `CREATE TABLE`, `SELECT`, `ORDER BY`, `GROUP BY`…
- The video **skips the basics** and focuses on **backend-relevant concepts**. **I should learn the basics first** (search "SQL basics", "Postgres basics").
- GUI used: **TablePlus**, a modern database client.

---

## 9. Postgres data types

### Integers and serials
| Type | Notes |
|---|---|
| `SERIAL` / `BIGSERIAL` | Auto-incrementing integer (1, 2, 3… when ID is omitted on insert). **`BIGSERIAL`** has much more capacity and is common for IDs in production |
| `SMALLINT` < `INTEGER` < `BIGINT` | Same idea, increasing capacity. Pick by need |

**Primary key:** a unique field that identifies a row.

### Exact vs floating-point numbers
```sql
price DECIMAL(10, 2)   -- 10 digits total, 2 after the decimal point
                       -- ✅ 12345678.90   ❌ 123456789.90 (11 digits)
```
- `DECIMAL` and `NUMERIC` are essentially identical.
- `REAL`, `DOUBLE PRECISION` (floats) are stored differently and can vary slightly across systems.

| Use | Type | Why |
|---|---|---|
| **Accuracy matters** (prices, money) | **DECIMAL** | Exact. Used in many calculations, so discrepancies are dangerous |
| Small discrepancies are fine (area/size like `567.8987`) | **Float** | **Faster** to store and compute. Preferred in scientific computing |

### Strings
| Type | Behaviour |
|---|---|
| `CHAR(10)` | **Fixed length**: `'ab'` is **padded** with 8 spaces |
| `VARCHAR(255)` | **Variable length** up to the max. `'ab'` takes 2. Exceeding 255 is a DB error |
| `TEXT` | Variable length, **no specified limit** (there's a very high cap, roughly hundreds of MB) |

**Which to use:**
- **Avoid `CHAR`** except for genuinely fixed-length values (e.g. weekday codes `MO`, `TU`… → `CHAR(2)`).
- **Prefer `TEXT`** over `VARCHAR(n)`:
  - The **Postgres docs recommend TEXT**. There's essentially **no performance difference**.
  - Myths ("VARCHAR(255) is faster", "you can't index TEXT") come from **other databases** (MySQL, SQL Server, SQLite) behaving differently.
  - **`255` is a MySQL-era habit.** It means nothing special in Postgres, but newcomers will assume it does and waste time digging for a reason.
  - Raising a VARCHAR limit later needs a **risky migration**.
  - As backend engineers we reach the DB through a **driver** with app code around it, so I can **enforce length in the app** and keep migrations simple.

### Others
| Type | Stores |
|---|---|
| `BOOLEAN` | true / false |
| `DATE` | date only |
| `TIME` | hour:minute:second |
| `TIMESTAMP` | date + time |
| `TIMESTAMPTZ` | date + time + **time zone** |
| `INTERVAL` | durations like "10 days", "1 week" |
| `UUID` | native UUID, popular for **primary keys** (unique, URL-friendly) |
| `JSON` | stored as **plain text** |
| `JSONB` | **binary**, Postgres's own serialized format → faster processing and querying. **Prefer JSONB** (Postgres-specific, not standard SQL) |
| Arrays | `INTEGER[]`, `JSONB[]`, `TEXT[]`… arrays of any type |
| `INET`, `MACADDR`, `POINT`, `XML`… | Rarely needed day to day. See the docs |

```sql
-- inserting: column order must match value order
INSERT INTO data_types_demo (small_col, int_col, price, flag, uid, meta)
VALUES (12, 1000, 199.99, true, gen_random_uuid(), '{"a": 1}');
```

---

## 10. Migrations

**Why not just run SQL in a GUI?** There's no record of **what changed, when, or by whom**, and no **versioning** of the schema over time.

**Migrations** = **sequentially ordered SQL files** applied by a **CLI tool** (e.g. **dbmate**, **golang-migrate**).

```
db/
└── migrations/
    ├── 20250101120000_create_users_table.sql
    ├── 20250102090000_seed_data.sql
    └── 20250103150000_add_indexes_and_triggers.sql
        ↑ timestamps (or 1, 2, 3…) keep them in order
```

### Up and down
```sql
-- migrate:up
CREATE TABLE users (...);

-- migrate:down
DROP TABLE users;
```
- **Up:** apply changes (create tables, types, indexes…).
- **Down:** **revert** exactly those changes, so I can **roll back** if something breaks in production. (Some modern approaches skip down migrations, but up + down is the standard.)

### How the tool tracks state
- It creates a table like **`schema_migrations`** with a `version` column holding the **latest applied** migration.
- On the next run it applies only **newer** files. Re-running old ones would fail ("table already exists").

```mermaid
flowchart LR
    F1["001.sql ✓"] --> F2["002.sql ✓"] --> F3["003.sql ✓"] --> F4["004.sql (new)"]
    T[("schema_migrations<br/>version = 003")] -.->|tool applies only newer| F4
```

### Benefits
1. **Track schema changes over time**, committed to Git alongside the code.
2. **Rollback** to a previous version.

**Every schema change (new table, altered column, index, trigger…) gets a new migration.**

### dbmate usage
```bash
# .env
DATABASE_URL=postgres://user:pass@localhost:5432/app?sslmode=disable

dbmate new create_users_table   # creates db/migrations/<timestamp>_create_users_table.sql
dbmate up                       # apply pending migrations
```

---

## 11. Modelling a project-management DB

Continuing from the API design video: a Jira/Linear-like platform.

### Enums
```sql
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE task_status    AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE member_role    AS ENUM ('owner', 'admin', 'member');
```

**Why enums instead of plain TEXT?**
1. **Data integrity at the DB level:** inserting `'something'` into `status` raises a **DB error**. I can also check in app code, but the DB is a stronger guarantee.
2. **Documentation (the bigger win):** a teammate reading old migrations (debugging, onboarding) sees the **allowed values at a glance**, instead of hunting through app code to find that `status` only ever holds three strings.

### The schema (my illustrative version)

```sql
-- migrate:up
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- one-to-one with users
CREATE TABLE user_profiles (
  user_id    UUID PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  avatar_url TEXT,          -- optional fields: no NOT NULL
  bio        TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  status      project_status NOT NULL DEFAULT 'active',
  owner_id    UUID NOT NULL REFERENCES users ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- one-to-many: project → tasks
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  priority    INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  status      task_status NOT NULL DEFAULT 'pending',
  due_date    DATE,
  assigned_to UUID REFERENCES users ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- many-to-many: users ↔ projects (linking table)
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users    ON DELETE CASCADE,
  role       member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)          -- composite primary key
);

-- migrate:down
DROP TABLE project_members;
DROP TABLE tasks;
DROP TABLE projects;
DROP TABLE user_profiles;
DROP TABLE users;
DROP TYPE member_role;
DROP TYPE task_status;
DROP TYPE project_status;
```

```mermaid
erDiagram
    users ||--o| user_profiles : "1-1 (user_id PK+FK)"
    users ||--o{ projects : "owns (owner_id, RESTRICT)"
    projects ||--o{ tasks : "1-many (project_id, CASCADE)"
    users ||--o{ tasks : "assigned_to (SET NULL)"
    users ||--o{ project_members : ""
    projects ||--o{ project_members : "many-many via linking table"
```

### Common columns on every table
- **`id`:** the **primary key**, uniquely identifying a row (e.g. `GET /users/:id` looks up by it). `UUID DEFAULT gen_random_uuid()` lets Postgres generate it.
- **`created_at`:** when the row was created (`DEFAULT now()`).
- **`updated_at`:** when it last changed. Useful e.g. to sort users by most recently edited.

### PRIMARY KEY implies
- **NOT NULL** + **UNIQUE**, plus foreign-key behaviour.

### NOT NULL everywhere (by default)
- Postgres columns are **nullable by default**.
- **Most (70%+) columns should be `NOT NULL`**, unless there's a real reason to allow null. Otherwise app bugs or automated scripts can quietly fill the DB with nulls.

### Other notes
- `email TEXT NOT NULL UNIQUE`: no two users with the same email (a duplicate → **unique-constraint violation**).
- `password_hash`: **never store plain-text passwords**. Store the hash.

---

## 12. Relationships: 1-1, 1-many, many-many

### One-to-one: `users` ↔ `user_profiles`
**Why a separate table?** Profiles grow over time (avatar, bio, phone, socials, websites, projects…). Keeping them separate means I don't **keep migrating and modifying the core `users` table**. The same pattern suits **user preferences** and **metadata**.

**How:** use the main table's PK as **both the PK and the FK** of the second table, named `<table>_id`:
```
users.id  ──►  user_profiles.user_id  (PRIMARY KEY + FOREIGN KEY)
```
No separate `id` needed, because each user has exactly one profile row. Optional fields (bio, phone, avatar) have **no NOT NULL**.

### One-to-many: `projects` → `tasks`
The child holds a **foreign key** (not its primary key) to the parent:
```
projects.id = 1
   ├── tasks (project_id = 1)
   ├── tasks (project_id = 1)
   └── tasks (project_id = 1)
```
`project_id NOT NULL` means **no orphan tasks**.

### Many-to-many: `users` ↔ `projects` via `project_members`
**How to spot it:** look at it both ways, and both make sense:
- a user can be in **many** projects,
- a project can have **many** users.

**How:** a **linking table** with FKs to both, plus a **composite primary key** `(project_id, user_id)`:
```
users: 1, 2, 3        projects: 1, 2, 3
                 project_members
                 ┌────────────┬─────────┬────────┐
                 │ project_id │ user_id │ role   │
                 ├────────────┼─────────┼────────┤
                 │     2      │    1    │ member │  ← "user 1 is in project 2" (one unique fact)
                 │     2      │    3    │ admin  │
                 │     1      │    1    │ owner  │
                 └────────────┴─────────┴────────┘
```
- User 1 can't be in project 2 **twice**. The composite PK gives uniqueness + NOT NULL and identifies the row.
- **`role` lives here**, because a role only exists **in the context of a user being in a project**. Default: `'member'`.

---

## 13. Constraints and referential integrity

**Constraints** are conditions on columns that **protect data from going corrupt**.

| Constraint | Effect |
|---|---|
| `NOT NULL` | No nulls allowed |
| `UNIQUE` | Value unique across the table |
| `PRIMARY KEY` | NOT NULL + UNIQUE + row identity |
| `CHECK (...)` | Custom condition, e.g. `priority BETWEEN 1 AND 5`, so 55 is rejected |
| `DEFAULT ...` | Value used when none is given, e.g. `priority = 1`, `status = 'pending'` (enums usually get a default so the app doesn't have to send one) |
| `REFERENCES` (FK) | Value **must exist** as a PK in the referenced table. A random UUID not in `users` fails on insert |

`REFERENCES users` on its own points at the referenced table's **primary key** (`users.id`).

### Referential integrity: what happens when the parent is deleted?
| Rule | On deleting the parent row |
|---|---|
| **`ON DELETE RESTRICT`** | **Blocks** the delete while children exist. E.g. can't delete a user who **owns projects**; delete the projects first |
| **`ON DELETE CASCADE`** | **Deletes the children too**. E.g. deleting a project deletes **all its tasks**; deleting a user or project removes their membership rows |
| **`ON DELETE SET NULL`** | Children's FK becomes NULL. E.g. deleting a user **un-assigns** their tasks (`assigned_to = NULL`). Fails if the column is NOT NULL |
| `ON DELETE SET DEFAULT` | Children's FK becomes its default value |

```
DELETE user 1
  projects.owner_id = 1     → RESTRICT  → ❌ delete blocked
  tasks.assigned_to = 1     → SET NULL  → assigned_to becomes NULL
  project_members.user_id=1 → CASCADE   → membership rows deleted
```

---

## 14. Naming conventions

- **Table names plural:** `users`, `user_profiles`, `projects` (the industry standard; some teams prefer singular, which is fine if consistent).
- **Lower-case snake_case** for tables and columns: `full_name`, `password_hash`, `created_at`.
- **Why not camelCase?** Postgres is **case-insensitive** for unquoted identifiers, so `fullName` becomes `fullname`. Keeping case would mean writing `"fullName"` **with double quotes everywhere** in app code, which is ugly and painful.

---

## 15. Seeding

- In production, data arrives through real user flows (sign-ups, forms…).
- In **development**, I need **test data** to try things out. That's **seeding**.
- Best practice: a **separate migration file** for seed data.

```bash
dbmate new seed_data
dbmate up
```

He uses **CTEs (common table expressions)** for readability, e.g.:
```sql
WITH inserted_users AS (
  INSERT INTO users (email, full_name, password_hash)
  VALUES ('john@example.com', 'John Doe', 'hash1'),
         ('jane@example.com', 'Jane Smith', 'hash2'),
         ('alice@example.com', 'Alice Brown', 'hash3')
  RETURNING id, email
)
INSERT INTO user_profiles (user_id, avatar_url, bio, phone)
SELECT id,
       'https://example.com/avatar.png',
       CASE email
         WHEN 'john@example.com' THEN 'Backend dev'
         WHEN 'jane@example.com' THEN 'Designer'
         ELSE 'Just here'
       END,
       '+10000000000'
FROM inserted_users;
-- ...then projects, tasks, members similarly
```

---

## 16. Queries for real APIs

### `GET /v1/users`: all users with their profile embedded
**Tip: write the `FROM` part first**, so I know where the data comes from, then `SELECT`.

```sql
SELECT u.*,
       to_jsonb(up.*) AS profile
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC;
```

- **Aliases** (`u`, `up`) make repeated references easier.
- **LEFT JOIN, not INNER JOIN:** a user may never have edited their profile, so there's no profile row. INNER JOIN would **drop** those users; LEFT JOIN keeps every user (profile = null). INNER and LEFT are the joins I'll use most.
- **`to_jsonb(up.*)`** turns the profile row into JSON, embedded as `profile`, so **one API call** returns both and the frontend doesn't need a second request.
- **Always `ORDER BY`**: rows come back in **no guaranteed order**. Default to `created_at DESC` (latest first).

```json
{
  "id": "…", "email": "john@example.com", "full_name": "John Doe", "created_at": "…",
  "profile": { "user_id": "…", "avatar_url": "…", "bio": "Backend dev", "phone": "…" }
}
```

After this, the app **deserializes** rows into native types (e.g. Go structs) and **serializes** them to JSON for the frontend. In Node.js that overhead is small.

### `GET /v1/users/:userId`: one user
```sql
SELECT u.*, to_jsonb(up.*) AS profile
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = $1;          -- parameter slot for the user ID
```
Flow: route → handler → service → repository → passes the ID as a **parameter** → result serialized to JSON.

---

## 17. Parameterized queries and SQL injection

- A **parameterized query** leaves a **slot** in the SQL, and I give the value **separately** at execution time.
- Whatever goes in the slot is treated as **plain data (escaped)**, **never as SQL**. Even `DELETE FROM users` passed as a value is just a string.
- This prevents **SQL injection**, which happens when I **build queries by concatenating strings** with user input. (Worth researching how SQL injection works.)
- In real code, the **driver / ORM** handles parameters. TablePlus also prompts for parameter values, which he uses for the demo.

```js
// ❌ vulnerable
db.query(`SELECT * FROM users WHERE id = '${req.params.id}'`);

// ✅ parameterized
db.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
```

String literals in SQL go in **single quotes**: `'a1b2-…'`.

---

## 18. Dynamic filter, sort, pagination

In a real backend, the query is **built dynamically** from query params:

```
?page=1&limit=10&letter=J&sortBy=email&sortOrder=asc
```

| Param | If missing |
|---|---|
| `page` | default **1** |
| `limit` | default **10/20** |
| `letter` (filter) | **leave the WHERE condition out entirely** (no default) |
| `sortBy` | default **`created_at`**. Only allow a **whitelist** (`full_name`, `email`, `created_at`) |
| `sortOrder` | default **`desc`** |

**List APIs should almost always be paginated**, unless the UI has a specific reason not to be.

```sql
SELECT u.*, to_jsonb(up.*) AS profile
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.full_name ILIKE $1 || '%'        -- names starting with the letter (case-insensitive)
ORDER BY u.email ASC                      -- sort column/order chosen from a whitelist in app code
LIMIT  $2                                 -- page size
OFFSET $3;                                -- (page - 1) * limit
```

- **`ILIKE`** is case-insensitive `LIKE`. `'J' || '%'` means "starts with J, anything after."
  - `J` → John Doe, Jane Smith · `X` → nothing · `A` → Alice Brown
- **Sort:** with aliases in the query, the sort column must match the alias (`u.email`). `ASC` vs `DESC` flips Jane and John.
- **Pagination:** user-facing `page` starts at **1**, but SQL **OFFSET starts at 0**, so translate in the backend. With `limit = 1`: offset 0 → Jane, offset 1 → John.
- The exact query-building changes a lot in real code, but this is what happens at the DB level.

---

## 19. Insert and partial update

### `POST /v1/users`
```sql
INSERT INTO users (email, full_name, password_hash)
VALUES ($1, $2, $3)        -- password hashed in backend code first
RETURNING *;               -- return the created row(s)
```

### `PATCH /v1/users/:userId/profile`: partial
- The form may send **any subset** of `bio`, `phone`, `avatar_url`.
- App code checks which **allowed fields** were sent and **only updates those**. Untouched fields stay as they are.
- If only `bio` and `phone` were sent, the built query looks like:

```sql
UPDATE user_profiles
SET bio = $1,
    phone = $2
WHERE user_id = $3          -- user ID from the URL's dynamic param
RETURNING *;
```

**Problem spotted:** `updated_at` didn't change after the update. It still equals `created_at`. Two fixes:
1. **Manually** set `updated_at = now()` in every update from app code, or
2. **A trigger**, below.

---

## 20. Triggers: auto-updating updated_at

**Trigger = when a condition happens, run an action automatically.**

```sql
-- migrate:up
CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ...same for user_profiles, projects, tasks, project_members

-- migrate:down
DROP TRIGGER trg_users_updated_at ON users;
-- ...drop the others
DROP FUNCTION set_updated_at();
```

- A **custom function** returns a trigger and sets the row's `updated_at` to the current timestamp.
- A **trigger per table** runs it on every update of a row.
- Named triggers make them easy to drop in the down migration.
- Re-running the profile update now shows `updated_at` = **the current time**. ✅

---

## 21. Indexes

### The book-index analogy
A book's index says "Chapter 4 starts on page 54", so I jump straight there instead of flipping through 50 pages.

### Without an index: sequential scan
- Rows live **scattered across the disk** (the DBMS uses complex storage algorithms). The GUI just shows them in order.
- To find a task by ID, the DB checks **every row, one by one**, until it matches. Fine for 6 rows, **terrible** for millions or billions.

### With an index: a lookup structure
```
INDEX on tasks.id                        DISK
┌──────────┬───────────────┐
│ id       │ location      │        ┌─────────┐
├──────────┼───────────────┤        │ row ... │ ◄─┐
│ a1…      │ → block 9182  │────────┼─────────┤   │
│ b7…      │ → block 0441  │        │ row ... │   │ direct jump
│ c3…      │ → block 7720  │────────┼─────────┤   │
│ ...      │ ...           │        │ row ... │ ──┘
└──────────┴───────────────┘        └─────────┘
 kept together, fast to search       rows scattered
```
- An index stores **field value → row location** together in one place, so lookup is fast and then the DB **jumps directly** to the row.
- (Internals like **B-trees** are worth researching separately.)

### Index order
- Indexes can be **ASC or DESC**. For a frequent `ORDER BY created_at DESC`, an index on `created_at DESC` means the data is already ordered, so no extra sorting.

### Rule of thumb: when to create an index
Index a column if it's used in:
1. a **JOIN condition**,
2. a **WHERE clause**,
3. an **ORDER BY**,

**and** that query runs **frequently**.

- **Primary keys are indexed automatically.** Foreign keys are **not**.
- **Indexes have a cost:** every INSERT or UPDATE must also update the index, which adds some overhead (grows with DB size). So evaluate frequency vs overhead. Create, **monitor**, and **drop** if the query turns out to be rare.

### The indexes migration (my illustrative version)
```sql
-- migrate:up
CREATE INDEX idx_users_email           ON users (email);             -- lookups/joins by email
CREATE INDEX idx_users_created_at      ON users (created_at DESC);   -- default list sort
CREATE INDEX idx_tasks_project_id      ON tasks (project_id);        -- tasks of a project (FK join)
CREATE INDEX idx_tasks_assigned_to     ON tasks (assigned_to);       -- tasks of a user (FK join)
CREATE INDEX idx_tasks_created_at      ON tasks (created_at DESC);   -- default task list sort
CREATE INDEX idx_tasks_status          ON tasks (status);            -- filter by status
CREATE INDEX idx_members_project_id    ON project_members (project_id);
CREATE INDEX idx_members_user_id       ON project_members (user_id);

-- migrate:down
DROP INDEX idx_members_user_id;
-- ...drop the rest
```

| Index | Reason |
|---|---|
| `users.email` | Find users by email, or join on email |
| `users.created_at DESC` | `GET /users` sorts by latest first, called often |
| `tasks.project_id` | "All tasks of a project": join `projects.id` (PK, auto-indexed) = `tasks.project_id` (FK, **not** auto-indexed) |
| `tasks.assigned_to` | "All tasks of a user": join `users.id` = `tasks.assigned_to` |
| `tasks.created_at DESC` | Default sort for the task list |
| `tasks.status` | Filter like `WHERE status = 'pending'` |
| `project_members.project_id`, `.user_id` | Same reasoning for membership lookups |

---

## 22. Wrap-up

- Writing queries for every API would take hours more. With this reasoning plus SQL/Postgres basics, **I should write the remaining queries myself** and see joins, indexes, and triggers in action.
- **That's roughly 80% of DB work as a backend engineer:**
  1. look at the API and its incoming payload,
  2. **build a dynamic query** from it,
  3. pass user values via **parameterized queries**,
  4. execute and **return the data**.

---

## 23. My cheat sheet

```
WHY DB        persistence (survives restarts) + efficient CRUD + integrity + concurrency
DISK vs RAM   DBs on disk (cheap, big, slower) · caches in RAM (fast, small, costly)
DBMS          organisation · access (CRUD) · integrity · security
TEXT FILES ✗  slow/error-prone parsing · no structure · concurrency races

SQL vs NoSQL  strict schema + integrity (CRM)  vs  flexible docs (CMS)
POSTGRES      open source · SQL-standard · extensible · reliable · great JSONB → default choice

TYPES
  BIGSERIAL/UUID ids · INTEGER family · DECIMAL for money (exact) · float when speed > precision
  TEXT > VARCHAR(255) (no perf diff in PG; 255 is a MySQL habit) · avoid CHAR (fixed-length only)
  TIMESTAMPTZ · DATE · INTERVAL · BOOLEAN · JSONB > JSON · arrays

MIGRATIONS    ordered SQL files + CLI (dbmate / golang-migrate)
              -- migrate:up / -- migrate:down (rollback) · schema_migrations tracks version
              every schema change = a new migration, committed to git
SEEDING       separate migration with test data (CTEs + RETURNING)

MODELLING
  every table: id (PK, DEFAULT gen_random_uuid()), created_at, updated_at
  NOT NULL by default (70%+) · UNIQUE email · store password_hash only
  ENUMs → DB-level integrity + self-documenting
  plural, lower_snake_case names (PG folds case → avoid camelCase quotes)

RELATIONSHIPS
  1-1      child PK = parent id (user_profiles.user_id PK+FK)
  1-many   child FK (tasks.project_id NOT NULL → no orphans)
  many-many linking table + composite PK (project_members(project_id, user_id)) + role

CONSTRAINTS   NOT NULL · UNIQUE · PRIMARY KEY · CHECK (priority 1–5) · DEFAULT · FOREIGN KEY
ON DELETE     RESTRICT (block) · CASCADE (delete children) · SET NULL · SET DEFAULT

QUERIES
  write FROM first · aliases · LEFT JOIN to keep parents without children
  to_jsonb(row) to embed related data · ALWAYS ORDER BY (default created_at DESC)
  parameterized ($1, $2) → no SQL injection (never concatenate user input)
  dynamic: ILIKE $1 || '%' · whitelist sortBy · LIMIT + OFFSET ((page-1)*limit)
  INSERT ... RETURNING * · partial UPDATE only for sent fields

TRIGGERS      function + BEFORE UPDATE trigger → auto updated_at = now()
INDEXES       value → row location lookup (avoid sequential scans)
              index cols used in JOIN / WHERE / ORDER BY on frequent queries
              PKs auto-indexed, FKs NOT · ASC/DESC matters · cost on writes → monitor, drop if unused
```
