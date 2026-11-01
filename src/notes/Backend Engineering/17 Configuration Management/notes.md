# My Notes: Production-Grade Configuration Management

> **Source:** "17. Production-grade Configuration Management" by Sriniously, *Backend from first principles* playlist (YouTube, 36:14)
> **Link:** https://www.youtube.com/watch?v=GR9NtirPXyc
>
> I wrote these from the video's full caption track, summarised in my own words. The diagrams, YAML and code are my own illustrations. (The video includes a sponsor segment for a hosting platform; I've left it out since it isn't part of the topic.)

---

## 1. What config management really is

- **Definition:** a systematic approach to **organising, storing, accessing, and maintaining all the settings** of a backend app.
- Think of it as the app's **DNA**: it decides **how the same code behaves in different environments**.
- Most people think only of **DB passwords, JWT secrets, API keys**. That's like saying a car is just its engine: important, but it misses about 90%.
- Config also controls:
  - how the app **starts up** and **connects** to external services,
  - how it **behaves per environment**,
  - **what, whether, and where it logs**,
  - where it sends **performance and business metrics**,
  - **which features are on or off**, and **for which users**.

---

## 2. Example: an e-commerce backend's config

| Config | Example |
|---|---|
| DB connection details | host, port, username, password, timeouts |
| Payment processor keys | Stripe API keys |
| **Feature flags** | old vs **new checkout flow**, possibly on for some users and off for others |
| Performance tuning | DB **connection pool size** |
| Security settings | **session timeout** (30 s? 60 s?) |
| **Business rules** | e.g. **maximum order amount** per user |

These have **different characteristics**:
- some are **secret/sensitive** (leaks cause damage and loss); others aren't secret but **control behaviour**,
- some change **often**, some **monthly or quarterly**,
- some are the **same everywhere** (dev/staging/prod), some **differ per environment**.

---

## 3. Why it matters: distributed systems and config chaos

- Modern backends rarely run alone. They're part of **distributed systems**: multiple services, databases, caches (Redis), message queues, third-party integrations (auth, email…).
- **Every integration point needs config**: how to connect, **handle failures**, **tune performance**, **stay secure**, per environment.

**Without a systematic approach → configuration chaos:**
- **hard-coded values** scattered across the codebase,
- **inconsistent behaviour** across environments,
- **security holes** from exposed secrets,
- **debugging nightmares**: I can't reproduce issues or tell which config caused a production break.

**The stakes are higher on the backend:**
```
Misconfigured FRONTEND → shows the wrong dialog / redirects to the wrong route
Misconfigured BACKEND  → exposes customer data · processes payments wrong · takes the platform down
```
Backends also run in many environments (cloud providers, on-prem servers, containers, serverless, edge functions), each with its own config needs.

---

## 4. Types of configuration

Not all config is equal. The type decides **storage, security, access patterns, and which environments get it**.

```mermaid
mindmap
  root((Config types))
    Application settings
      log level
      port
      connection pool size
      timeouts
    Database
      host · port · user · password · db name
      query timeouts
    External services
      email (Mailchimp / Resend)
      payments (Stripe)
      auth (Clerk)
    Feature flags
      new checkout for US only
      A/B tests
    Others
      infra / DevOps
      security (JWT & session secrets)
      performance tuning (Go: max CPUs)
      business rules
```

### 4.1 Application settings (the most common)
| Setting | Notes |
|---|---|
| **Log level** | `debug` locally, to see and tell logs apart while building. **`info` in production**, to avoid cluttering valuable prod logs |
| **Port** | e.g. 8080 locally. Production depends on setup (VPS, Kubernetes…) |
| **Connection pool size** | Max DB connections in the pool |
| **Timeouts** | e.g. HTTP request timeout. **If it's 60 s but AI image generation takes ~80 s, the request drops with a 504 Gateway Timeout** |

### 4.2 Database config
- **host, port, username, password, database name**, combined into a **connection URL** used at runtime.
- Plus things like **query timeouts**.

```
postgres://app_user:secret@db.internal:5432/shop?sslmode=require
```

### 4.3 External services
- **API keys** to initialise clients: email (Mailchimp, Resend), payments (Stripe), auth (Clerk), etc.

### 4.4 Feature flags
- **Dynamically enable/disable features** without redeploying code.
- **Example:** a new checkout flow (new API) for **A/B testing**, **on for US users, off for India**.

```
if (flags.newCheckout.enabledFor(user.country))  → new checkout API
else                                             → old checkout
```

### 4.5 Others
- **Infra / DevOps** config
- **Security:** JWT secret, session secret
- **Performance tuning:** e.g. Go env vars like max CPUs
- **Business rules:** centralised logic rules

---

## 5. Where config is stored

### 5.1 Environment variables (most common)
- An **OS feature**. Languages read from the process environment.
- **Locally:** a `.env` file plus a library (e.g. **dotenv**) that loads it into the environment, instead of running `export` by hand. Common in Node, also available in Python, Go, etc.
- **Deployed (containers / Kubernetes / cloud):** the deploy pipeline **fetches secrets** from a secrets manager and **injects them as env vars**, then the app starts and reads them.

```mermaid
flowchart LR
    D["Deployment triggered"] --> F["Fetch secrets from<br/>Vault / AWS Parameter Store /<br/>Azure Key Vault / GCP Secret Manager"]
    F --> L["Load into container environment"]
    L --> S["App starts, reads env vars"]
```

```bash
# .env (local only, never committed)
PORT=8080
LOG_LEVEL=debug
DATABASE_URL=postgres://dev:dev@localhost:5432/shop
STRIPE_API_KEY=sk_test_...
```

### 5.2 Files
| Format | Notes |
|---|---|
| **JSON** | Works, but **no comments** |
| **YAML** | **Most popular** for config. Supports **comments**, good for sharing team knowledge |
| **TOML** | Newer, also widely used |

He shows real open-source repos:
- **Authelia** (an auth provider, written in Go) has a `configuration.yaml` with server, log level, storage, notifications, identity, regulation, session settings, and many `config.yaml` files across the repo.
- **Apache Incubator Answer** has fixed app settings in YAML: server port, local DB (SQLite), Swagger UI config.

```yaml
# config.yaml (illustrative)
server:
  port: 8080          # local default
  timeout_seconds: 90 # long enough for slow AI generation
log:
  level: debug        # use "info" in production
database:
  max_pool_size: 10
features:
  new_checkout: false
```

### 5.3 Key-value stores
- Dedicated tools like **Consul** or **etcd** (cloud-native).
- **Lightweight and simple** compared with hierarchical structures. They act much like env vars.

### 5.4 Cloud secrets managers
- **HashiCorp Vault**, **AWS Parameter Store**, **Azure Key Vault**, **Google Secret Manager**.
- With **distributed deploys** (Kubernetes, autoscaling, sometimes **multiple cloud providers** at once), a **centralised** store with ready-made integrations and docs makes a lot of sense at real production traffic.

### 5.5 Hybrid (very common)
A config **loader** pulls from several sources with a **defined priority**, conditionally per environment, and builds the **runtime settings**:

```
Priority (example):  1. AWS Parameter Store  →  2. config.yaml  →  3. environment variables
                     merged at startup → one runtime config object
```

---

## 6. Per-environment config

Each environment has **different priorities**, so config **values and loading** differ. **The code stays the same and only the config changes the behaviour.** That's the point of centralising config instead of hard-coding.

| Environment | Top priority |
|---|---|
| **Development** (localhost) | **Developer productivity** and **debugging** |
| **Test** (e.g. a GitHub Actions run) | **Automated validation** and **QA** (unit/integration tests) |
| **Staging** (hosted copy that behaves like prod) | **Mirror production** to catch issues early, **while keeping cloud costs down** |
| **Production** | **Reliability, security, performance** |

### Example: DB connection pool size
| Env | Max pool | Why |
|---|---|---|
| Dev | **10** | Plenty for local work on modern machines |
| Staging | **2** | Used only by devs/testers. Accept some delay to **save cloud costs** (an exact prod mirror costs as much as prod) |
| Production | **50** | Big user base and **traffic spikes** |

---

## 7. Security

1. **Never hard-code secrets:** production DB URLs, Clerk/email/payment API keys, etc. never go in the codebase.
2. **Prefer a cloud secrets manager** (Vault, AWS Parameter Store, Azure Key Vault, Google Secret Manager). **Over-engineering security is a good thing.** They handle:
   - **encryption at rest**: secrets encrypted wherever they're stored,
   - **encryption in transit**: fetched secrets arrive encrypted and are decrypted with a private key held in my infra (GitHub Actions secrets, repo secrets, Kubernetes environment…).
3. **Access control: least privilege.**

```
Frontend devs → only frontend configs (backend API URL, frontend integration keys)
Backend devs  → DB, Redis, Elasticsearch, ...
DevOps        → cloud infra access (e.g. EC2) — nobody else
```
4. **Rotate periodically:** API keys, secrets, JWT secrets, so they're less exposed to leaks.

---

## 8. Validate your config (the #1 takeaway)

- A common mistake: load env vars and just read `process.env.SOMETHING` with **no validation**.
- **At load time** (right after deploy, **before the app starts serving**), **validate every config value** from **every source** (Parameter Store, `config.yaml`, env vars…).
- Use a proper validation library:
  - **TypeScript:** **Zod**
  - **Go:** **go-playground/validator**
- Decide which values are **mandatory** and which are **optional with defaults set in code**.
- He learned this the hard way: a missing mandatory variable can make production **break or behave strangely**, and it's **hard to spot**.

```ts
// config.ts (Zod sketch)
import { z } from "zod";

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(8080),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.string().url(),                 // mandatory
  DB_MAX_POOL: z.coerce.number().int().positive().default(10),
  STRIPE_API_KEY: z.string().min(1),              // mandatory
  FEATURE_NEW_CHECKOUT: z.coerce.boolean().default(false),
});

const parsed = ConfigSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);                                 // fail before serving traffic
}
export const config = parsed.data;
```

> **If I take one thing from this video: always validate configs, whatever their source.**

---

## 9. My cheat sheet

```
CONFIG = all settings that decide how the SAME code behaves (the app's DNA)
  not just secrets: startup, connections, per-env behaviour, logging, metrics, feature flags

TYPES
  app settings  log level (debug→info in prod) · port · pool size · timeouts (60s vs 80s AI → 504)
  database      host/port/user/password/name → connection URL · query timeouts
  external      email (Resend/Mailchimp) · Stripe · Clerk API keys
  feature flags dynamic on/off, A/B, per-region (new checkout US only)
  others        infra · security secrets · perf tuning · business rules (max order amount)

WHY           distributed systems → every integration needs config
CHAOS         hard-coded values · inconsistent envs · leaked secrets · unreproducible bugs

STORAGE
  env vars (.env + dotenv locally; injected at deploy)
  files: YAML (comments!) > JSON (no comments) · TOML
  KV stores: Consul, etcd
  secrets managers: HashiCorp Vault · AWS Parameter Store · Azure Key Vault · GCP Secret Manager
  hybrid loader with priority order

ENVIRONMENTS (same code, different config)
  dev = productivity/debug · test = automated QA · staging = mirror prod cheaply · prod = reliability/security/perf
  pool size: dev 10 · staging 2 · prod 50

SECURITY
  never hard-code secrets · use a secrets manager (encrypted at rest + in transit)
  least-privilege access per team · rotate keys/secrets periodically

#1 RULE   VALIDATE ALL CONFIG AT STARTUP (Zod / go-playground validator) → fail fast
```
