# My Notes: The Twelve-Factor App

> **Source:** "27. The Twelve-Factor App" by Sriniously, *Backend from first principles* playlist (YouTube, 1:33:18)
> **Link:** https://www.youtube.com/watch?v=2_fcv3-XfN4
>
> I wrote these from the video's full caption track, summarised in my own words. The diagrams, config snippets and code are my own illustrations. Anything marked *(my note)* is my addition, not from the video.

---

## 1. Why this video

Throughout the playlist he prescribed lots of decisions **without defending them**:
- why **config goes in environment variables**
- why the **server binds a port**
- why **logs go to stdout**
- why **processes must be stateless**
- why **killing a process should lose nothing**

Near the end of the playlist, he shows **where those decisions come from**. One-line answer: **the Twelve-Factor App.**

---

## 2. What the twelve-factor app is

- **12 rules** written in **2011** by the people running one of the first cloud platforms, **Heroku**.
- **In two sentences:** it's a **contract between my app and the platform that runs it.** It states what must be true about the app so that **any machine, any platform, and any new teammate** can **run, scale and update it without surprises.**

**Every platform I'll deploy to assumes it,** directly or indirectly: **Heroku** (they wrote it), **Docker, Kubernetes, Render, Railway, Fly, Cloud Run, App Runner, Vercel, Netlify**…
- "We inject config through the environment", "write logs to stdout so we can collect them": **that's the twelve factors talking.**
- Some rules are now so standard that people follow them **without knowing the source**. That's good: it's just **how things work**.
- **Follow the factors** and operating on any of those platforms is easy. I'm already on their standards instead of **fighting them**.

This video is part **history lesson**, part **map of a contract I already follow**, now with a name.

---

## 3. Scope

- **In scope:** apps that **run as a service**: web apps, APIs, anything deployed and **reachable over a network**. **Any language, any database, any queue.**
- **Out of scope:** desktop software, mobile apps.
- The factors are about the **interface between the app and the platform**, **not** a list of everything good in software. **DRY, KISS** etc. aren't factors.
- He won't go into **Kubernetes operations** or **microservice architecture**: just the factors.

---

## 4. Who wrote it, and why trust them

- **2011**, when **Heroku** was ~**3 years old**.
- **PaaS (platform as a service):** I give them **code**, they do everything else (**build, environment, config, DB connections, networking**) until it's **live on the internet** under my domain.
- From that business they'd watched **hundreds or thousands of apps** get deployed, scaled, **break in production and get corrupted**, across many languages and frameworks. **Perfect visibility to spot patterns.**
- **Adam Wiggins** (Heroku co-founder) wrote them up and published at **12factor.net** in **2011**.

---

## 5. Deploying in 2011: snowflakes and erosion

What deploying looked like (he wasn't a developer then, so this is from others' experience):

```
1. rent a server (basic VPS) or use a PHYSICAL machine in the office
   (AWS existed but cloud wasn't the standard yet)
2. install the OS by hand (Ubuntu / some Linux)
3. install the language runtime by hand (Java / Go / Python…)
4. install the database + supporting libraries
5. copy the app onto the machine — often via FTP
6. edit config files ON the server, manually, over SSH
```

- Every server was a **snowflake**: **unique, hand-built, impossible to reproduce.** Even following a manual, someone else would get a step different.
- **Machine dies → start from scratch** (from memory, or the manual).
- **New developer:** **days** just to get the app running locally, and it **still didn't match production** → **"it works on my machine."**
- Teams **froze all other work** to schedule deployments.

### Software erosion
The document's name for this: **the app slowly stops working even though nobody changed its code.**
- The **OS gets patched** (distro update).
- **Two apps on one server**: the other app **updates a shared library** and breaks mine.
- **The person who built the infra leaves**, without documenting every manual change (and **you can't track every manual change**).

> **The twelve factors are my defences against erosion.**

---

## 6. The 2024 open-source rewrite

- The document sat **frozen for ~13 years**. The footer says **last updated 2017**, and that update was tiny.
- Meanwhile: **containers, Kubernetes, serverless, managed cloud infrastructure everywhere.**
- **November 2024:** **Heroku (now owned by Salesforce)** **open-sourced** it:
  - moved it to a **public repo** under a **neutral organization**
  - wrote a **governance document**
  - invited maintainers from **other companies, including AWS and Google Cloud**
  - announced on stage at **KubeCon, November 2024**
- The revision is happening **in public on a branch called `next`**:
  - keeps **all 12 names and one-line mottos**
  - rewrites each factor into a **numbered list of principles**, separating **timeless principles** from **2011-era** detail
- As of recording, the **live site still shows the 2011 text**. The rewrite is an **unmerged working draft**.

**Plan for each factor:** what it says plainly → what problem it fixed → where we've seen it in the playlist → what the rewrite changes → whether it **aged well or badly**.

---

## Factor 1: Codebase
> **One codebase tracked in revision control, many deploys.**

### Part 1: tracked in revision control
- Obvious today (Git + GitHub/GitLab/Bitbucket, used every hour).
- Worth writing down in 2011: many production apps were **a folder on someone's computer** or **`final_v2_really_final.zip` emailed to teammates**.

### Part 2: many deploys (the non-obvious idea)
- **Deploy = one running instance of the app.** Production is a deploy, staging is a deploy, and these days often a **per-PR preview deploy**.
- **Same codebase, different deploys.** What differs between them? **Never the code.** They may run **different commits**, but **all commits are in the same repo**.
- **What differs is config** (prod talks to a real DB, my laptop to Postgres in Docker). **Code is shared by all deploys. Config is unique to each.**

```
repo HEAD = commit 100
  production  → commit 97   (deployed last Friday)
  staging     → commit 99   (testing tomorrow's release)
  my laptop   → commit 100 + 2 unpushed commits
  = 4 deploys, ONE codebase

release day: staging → 100, then production → 100
(nothing about the deploys changed except WHICH COMMIT each runs)
```

> **If I can't describe each environment as "the same codebase at commit X", something is going wrong.**

### Two boundaries
- **Multiple codebases ≠ an app.** That's a **distributed system** of apps, **each following the 12 factors itself**.
- **Two apps sharing code by copy-paste = violation.** Shared code becomes a **library** consumed via the **dependency manager** (factor 2).

### 2026: monorepos
- Often argued as an anti-pattern under this factor. **He disagrees.**
- The definition: a codebase is a repo, **or any set of repos sharing a root commit**, and the test is **one-to-one between codebase and app**.
- A monorepo building **5 apps** = **5 codebases that happen to live in one repo**, each with its own 12 factors. ✅
- **The real anti-pattern:** **the same app existing in two places**, i.e. copy-paste sharing.

---

## Factor 2: Dependencies
> **Explicitly declare and isolate dependencies.**

### Declare
- A file in the repo listing **completely and accurately every library** the app needs: the **manifest**.

| Ecosystem | Manifest | Lock file |
|---|---|---|
| Node.js | `package.json` | `package-lock.json` |
| Go | `go.mod` | `go.sum` |
| Python | `requirements.txt` / `pyproject.toml` | (tool lock files) |
| Ruby | `Gemfile` | `Gemfile.lock` |

- **Without a manifest:** a new laptop or teammate digs through every import, **guesses versions**, hits **version clashes**, and loses 2–3 days.
- **With one:** **a single command** installs everything and the app runs.
- 2011 text: **Gemfile + `bundle install`** (Rails era).
- **Now even stronger: lock files.** A manifest says *roughly* what's needed (version ranges). A **lock file pins the exact version of every library, and every library's libraries**. Run the app months or years later and you get **the same versions**.

### Isolate
**Python example:**
- `requirements.txt` says **`requests` v2**.
- The app runs on the **system Python**, where some other tool installed **`requests` v1**.
- The import finds the **system copy first**, so the app runs something I didn't declare.

```
declare without isolate → can't expect it to work everywhere
isolate without declare → days/weeks trying to reproduce versions (maybe never)
```
- **Declaration** comes naturally (can't work without it). **Isolation is easy to forget:** **nothing should leak in from the machine.**
- 2011 text: **`bundle exec`** (Ruby), **virtualenv** (Python), so the app sees **only declared dependencies**.

### System tools leak too (vendoring)
An image-resizing backend shells out to **ImageMagick**:
- **Mac (Homebrew):** ImageMagick **v7**, binary called **`magick`**
- **Ubuntu server (apt):** ImageMagick **v6**, binary called **`convert`**, **different defaults**
- **Same code, two different programs**: major versions bring breaking changes and different behaviour.

### Modern rewrite: containers
- A **Docker image** freezes **libraries, the OS, system tools and the runtime itself**. That's the **peak of declaration + isolation.**
- That's why people say **Docker practically solved this factor.**

```dockerfile
FROM golang:1.23 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download                 # declared + locked
COPY . .
RUN go build -o /app ./cmd/server

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y imagemagick   # system tool pinned in the image
COPY --from=build /app /app
ENTRYPOINT ["/app"]
```

---

## Factor 3: Config
> **Store config in the environment.**

One of the **most quoted and most argued** factors.

### What counts as config?
**Anything likely to differ between deploys:**
| Thing | Local | Production |
|---|---|---|
| Database URL | `localhost` (Postgres in Docker) | **Amazon RDS** over a VPC |
| Email | provider **sandbox** API | real sending |
| Object storage | local **MinIO** | **AWS S3** |
| Redis | container | managed Redis |

### Code or config? The open-source test
> **Could I open-source my production codebase *right now* without compromising a single credential?**
Not *would* I, but *could* I. If **no**, config is living inside my code.

### Why environment variables?
1. **Easy to change between deploys** without touching a file.
2. **Can't be committed to the repo by accident**, which is exactly how **credentials leak every day**.
3. **An OS-level standard**, independent of language or framework: the same mechanism for **Go, Node, Rust, Python, even a bash script**.
- Compared with 2011 alternatives: **Java properties files**, **Rails `config/database.yml`**, every framework with its own format, and they **regularly got committed and leaked credentials.**

### Example: the Tasker codebase (from an earlier video)
- The `config` package declares **all configuration as one Go struct** with blocks for **server, database, auth, Redis, email, AWS, observability, cron**.
- **~38 config values**, all loaded from env vars with a prefix: **`TASKER_SERVER_PORT`, `TASKER_DATABASE_HOST`**…
- **Git history:** config values **changed many times** (new integrations, timeouts, hosts), but **the code that reads them barely changed.**
- That's what the factor wants: **things with different rates of change shouldn't live in one place.**

```go
type Config struct {
    Server   struct{ Port int `env:"TASKER_SERVER_PORT"` }
    Database struct {
        Host string `env:"TASKER_DATABASE_HOST"`
        Port int    `env:"TASKER_DATABASE_PORT"`
        Name string `env:"TASKER_DATABASE_NAME"`
    }
    Redis struct{ URL string `env:"TASKER_REDIS_URL"` }
    // auth, email, AWS, observability, cron … ~38 values total
}
```

### Don't group config into named environments
- 2011 text warns against `config/environments/staging.rb`, `production.rb`, `development`, `test`…
- **Doesn't scale:** someone needs a deploy "like staging but pointing at a different DB" (say, a PR branch), so **every new deploy means more code**.
- **Instead:** config is **individual and granular**, each value **an independent env var**, **never tied to a mode name**. **Compose a new deploy by setting values, not by choosing a mode.**
- The rewrite keeps this: env vars are **granular controls**, **never grouped as environments.**

### The controversy: secrets in env vars?
- Fine for a **DB hostname**. What about the **DB password**?
- **2017: Diogo Mónica** (ran security at **Docker**) wrote a famous article: **don't put secrets in environment variables**, because **the environment leaks eventually**:
  - **child processes inherit the whole environment** (any shell command you spawn gets every secret)
  - **crash reporters and debug pages** often **print the whole environment**
  - on Linux, a process's environment is **readable at `/proc/<pid>/environ`** with the right access
  - various tools **log** it
- **Better pattern for secrets:** a **separate secret manager**. The app **reads credentials at startup** and **keeps them in memory**, not anywhere else in the OS.

### Where it stands
- **Strict separation of config from code: non-negotiable**, then and now.
- **Env vars: the right default** for **everything that isn't a secret.**
- **Secrets:**
  - **Solo or small team:** env vars injected by the **platform's secrets feature** are fine, and **far better than committing them.**
  - **As the product and team grow:** a **secret manager** is the no-brainer: **Vault**, **AWS Parameter Store**. Fetch at startup, hold in memory, **rotate periodically, audit access**.

```go
// secrets: fetched once at boot, kept in memory (my sketch)
func loadSecrets(ctx context.Context, ssm *ssm.Client) (string, error) {
    out, err := ssm.GetParameter(ctx, &ssm.GetParameterInput{
        Name: aws.String("/tasker/prod/db_password"), WithDecryption: aws.Bool(true),
    })
    if err != nil { return "", err }
    return *out.Parameter.Value, nil
}
```

---

## Factor 4: Backing services
> **Treat backing services as attached resources.**

- **Backing service = anything the app consumes over the network**: **Postgres, Redis, a queue, SMTP, S3, third-party APIs (payment provider)**…
- **Rule:** the code makes **no distinction between a service I run and one someone else runs.** All are **attached resources** reached via a **resource handle**.
- **Resource handle = URL + credentials**, which lives in **config** (factor 3).
- Local Postgres container or **AWS RDS**, local Redis or managed Redis: **same code. Only the handle changes.**

**The 2011 test:** can I swap my local Postgres URL for a managed one (**Neon, PlanetScale, Supabase, Amazon RDS**) **without changing a line of code**? If yes, I'm compliant.

### Anatomy of a Postgres handle
```
postgres://tasker:s3cret@db.internal.example.com:5432/tasker
└──┬───┘   └──┬─┘ └─┬──┘ └──────────┬──────────┘ └─┬┘ └─┬──┘
 scheme      user  password        host           port  database
 (speaks the                                     (default 5432)
  Postgres wire protocol)
```

### How it aged: **very well, practically a prediction**
- In 2011, "**the database is somebody else's computer, reached by a URL**" was **eccentric**. Most people ran **server and DB on the same machine**.
- Today it's **everywhere**, and **server + DB on one instance is considered an anti-pattern** for scaling.
- Managed everything: **RDS, Neon, PlanetScale** (DB), **managed Redis**, **S3** (storage), **Resend** (email) instead of a custom SMTP server.

---

## Factor 5: Build, release, run
> **Strictly separate build and run stages.**

```mermaid
flowchart LR
    C["Code @ commit"] --> B["BUILD<br/>fetch deps (factor 2), compile<br/>→ executable bundle / image<br/>(code + deps, NO config)"]
    B --> R["RELEASE<br/>build + this deploy's config<br/>→ release #N (immutable)"]
    CFG["Config<br/>(staging / prod / PR preview)"] --> R
    R --> RUN["RUN<br/>launch process(es)<br/>from the release"]
```

| Stage | What happens |
|---|---|
| **Build** | Pull code **at a specific commit** (deploys are driven by **source control**, not FTP or SSH), fetch dependencies from the manifest, **compile** if needed → **one executable bundle = "a build"**. Go: **a single binary**. Node: **app + `node_modules`**. Containers: **an image**. **Contains code + deps only, never config** |
| **Release** | **Build + the deploy's config** = a **release**, ready to run. Same build + prod config = prod release; + staging config = staging release |
| **Run** | **Launch a process** from the release |

### Benefit 1: instant, free rollbacks
- Builds are **immutable**, and a release is just build + config.
- **Releases are an append-only ledger**: each has an **ID** (timestamp or incrementing number), and **a release is never modified once created**.

```
afternoon   build @ commit 97 + config A        → release 100
+2 h        someone rotates the DB password       → release 101 (same build, config B)
+2 h        new code merged, deployed            → release 102 (new build, config B)
            → dashboard fills with errors, users complaining in Slack
FIX:        re-run release 101 → live in SECONDS
            then debug 102 calmly, however long it takes
```
- Possible **only because builds are immutable**: release 101 still means **exactly** what it meant two hours ago.
- **Heroku releases, Docker image tags, Kubernetes rollouts** all use this pattern.

```bash
kubectl rollout undo deployment/tasker          # back to the previous ReplicaSet
kubectl rollout history deployment/tasker       # the release ledger
```

### Benefit 2: no hot-patching production
- **Code enters only at the build stage**, so there's **no path from a running machine back into the build**. Nobody can edit code on the prod server, even if they try.
- Contrast with snowflakes: **SSH in, hot-patch, reload**, which is how **production and the repo drifted apart**.

### Rewrite
- The one change: **immutability**, implied in 2011, is now **mandatory**. **Each release must be a unique, immutable snapshot.**

---

## Factor 6: Processes
> **Execute the app as one or more stateless processes.**

- Processes that **remember nothing between requests**: the **statelessness** we've discussed in almost every video. It's what lets us **scale**.
- **Share nothing** between processes: **no shared memory, no shared disk.**
- Anything that must persist goes in a **stateful backing service** (an attached resource, factor 4).
- **Assume any request can be served by any process, and any process can disappear at any moment.**

### What a process *may* hold
- **Memory and local disk as a cache for a single transaction.** E.g. download a file, process it, write the result to the DB. The **temp file is fine**: nothing expects it afterwards, and the temp dir disappears anyway.
- It's a problem **the moment a future request or process depends on that file still being there.**

### Sticky sessions: an explicit violation
```
App keeps logged-in sessions in PROCESS MEMORY:
1 instance   → works perfectly
3 instances  → user logs in on #1, next request lands on #2
             → #2 has never heard of them → randomly logged out
"fix": sticky sessions — LB remembers user→instance and always routes there
```
- **The document says sticky sessions are a violation and should never be used.**
- **Why:** stickiness **defeats having 3 instances**:
  - an instance dies (traffic, corruption) → **all its users are logged out**
  - add an instance for load → it **gets no existing users**, so new capacity doesn't help them
- **Fix:** **session data is state, and state goes in a backing service**: **Redis or Postgres**, depending on comfort and latency needs.

### WebSockets: the honest exception
- From the real-time video: a WebSocket is **state in process memory**, and **only that instance** can talk to that user. We used **pub/sub** to bridge instances.
- **His view:** statelessness is **the default, applied everywhere**. I'm **allowed to break it when the feature itself *is* the state** (real-time connections).

> **Rule of thumb: if I can't kill any process at any moment without a user losing data, there's state somewhere it doesn't belong.**

---

## Checkpoint after six factors

```
✔ code lives in ONE repo                                  (1)
✔ dependencies DECLARED + ISOLATED                        (2)
✔ all differences live in the ENVIRONMENT                 (3)
✔ every neighbour attached via a HANDLE                   (4)
✔ to production via BUILD → RELEASE → RUN                 (5)
✔ runs as a DISPOSABLE, FORGETFUL process                 (6)
```
Already a lot of freedom for the service.

---

## Factor 7: Port binding
> **Export services via port binding.**

**2011 context:**
- **PHP** (the "React" of its day) **didn't run itself.** **Apache** ran, and the PHP app was a **module loaded inside Apache**.
- **Java** apps didn't run either. **Tomcat** ran, and the app was a **file dropped into Tomcat's folder**.
- The **web server was the program**, and my app was a **guest** inside it. So the **web server's version and config were part of my app's runtime environment**, on the physical server. **Back to erosion.**

**The factor:** the app is **completely self-contained**. It **brings its own HTTP server as a library** (via the factor 2 manifest) and **exports itself by binding to a port** and listening.

```go
func main() {
    port := os.Getenv("PORT")                  // the platform tells me which port
    if port == "" { port = "8080" }
    http.ListenAndServe(":"+port, routes())    // the HTTP server is a LIBRARY in my binary
}
```

- Obvious in 2026: Go often **:8080**, Node **:4000**, databases on default ports.
- **Dev:** hit `localhost:8080` directly. **Prod:** a **routing layer / reverse proxy** forwards the public hostname to the process's port.
- **Nice consequence:** **any app can be a backing service for any other app.** DB, cache and email service all on local ports in dev; in prod, swap the handles for **someone else's port on someone else's computer**. Same pattern throughout.

### What aged: serverless
- An **AWS Lambda** function **doesn't bind a port.** The **platform calls a function** I export.
- 2011 predicted "port-bound, running 24/7" would persist. It's still dominant, but **serverless** is a whole other category with **no long-running port-bound server**.
- **Rewrite:** keeps **port binding as the headline**, but generalises: the app is **self-contained** and **exports its service through a declared interface**, covering **both** port-bound servers and serverless functions.

---

## Factor 8: Concurrency
> **Scale out via the process model.**

**2011: every runtime scaled differently:**
- **Java:** one **huge JVM process** grabs a **big block of RAM** at startup and **multiplexes with threads** inside.
- **PHP:** the opposite. **Apache spins up small child processes on demand.**

**The factor:** make **the process a first-class citizen**. Design so the app **scales as multiple processes from the start**. Inspired by the **Unix service-daemon model**.

### Process types
| Work | Process type |
|---|---|
| HTTP requests | **web** |
| Heavy background jobs (video encoding, image resizing) | **worker** |
| Scheduled jobs (email everyone at midnight) | **scheduler / clock** |

**Each type scales independently, by running more copies.**

### The food-delivery example (each process ≈ 500 MB)
```
LUNCH   needs 10 web, 2 workers
  combined process ×10 → 10 GB  (5 GB of idle workers dragged along)
  split: web=10, worker=2 → 6 GB

NIGHT   few orders, lots of background jobs
  split: web=5, worker=20
```

**Process formation** = the **type and count** of each process, e.g. `web=3, worker=2`. Still everyday vocabulary:
```procfile
# Procfile
web:       ./tasker serve
worker:    ./tasker worker
scheduler: ./tasker cron
```
```yaml
# Kubernetes Deployment spec
spec:
  replicas: 3          # ← process formation, in YAML
```

### Notes
1. **Threads inside a process are fine**: JVM threads, Go goroutines, Node's event loop. But **the unit of scale is the process**, not threads. **One machine only grows so far** (vertical limits), and **share-nothing processes scale across machines** without a second thought.
2. **A 12-factor app never daemonizes and never writes a PID file.** Process management is **not the app's job**. It's the **OS's** (systemd), **Kubernetes'**, or the **process manager's**. **The app runs in the foreground** and lets the platform run it.

### How it aged: so adopted it's invisible
- Practically everything runs on **Kubernetes or another orchestrator**: **declare a formation**, and the platform keeps it (kills, starts, restarts containers). I don't think about it.
- **Still directly relevant** if I deploy straight onto an OS with **systemd**.

---

## Factor 9: Disposability
> **Maximize robustness with fast startup and graceful shutdown.**

Processes must be **disposable**: **started or stopped at a moment's notice**, with **nothing destructive** happening either way. (Full lifecycle in **video 19, graceful shutdown**.)

### Why it matters now
- Who starts and stops my processes? **The platform**, constantly: scaling adds processes, **deploys kill old ones and start new ones** from the new image, the orchestrator **moves processes between machines whenever it likes**.
- **5 deploys/week × 10 instances = 50 stops + 50 starts**, before any scaling.
- **A process dying is not an incident anymore. It's part of the release lifecycle.**

### Fast startup
- **60 s boot** → a **rolling deploy of 10 instances takes ~10 min**, and the **autoscaler is a minute late** to every traffic spike.
- **2 s boot** → negligible.
- **Startup should take seconds.**

### Graceful shutdown
```
SIGTERM received
 web process:    stop accepting NEW requests → finish in-flight requests → exit
 worker process: return the CURRENT JOB to the queue (don't discard it) → exit
```
- Careless shutdown means **in-flight requests error out on every deploy**.
- Returning a job to the queue assumes **re-entrancy**: the half-done job must **leave no dirty state**, so running it again is safe. How:
  - **wrap processing in a transaction**, or
  - make it **idempotent**: running it N times gives the same result (detects "already done" and skips)

```go
func (w *Worker) handle(ctx context.Context, job Job) error {
    return w.db.InTx(ctx, func(tx Tx) error {
        if done, _ := tx.JobDone(job.ID); done { return nil }   // idempotent: already processed → skip
        if err := process(tx, job); err != nil { return err }  // tx rollback on failure → no dirty state
        return tx.MarkJobDone(job.ID)
    })
}
```

### Robust against sudden death
- **SIGTERM is the polite case**: ~**30 s** to clean up. That's why it's called graceful.
- **Hardware failure, or OOM kill** (process grabs too much memory, container killed): **no warning**, killed mid-instruction.
- → Design so **any process can die mid-instruction at any time.**
- The document points to **crash-only design**: if the app **survives crashes**, it **doesn't need a graceful-shutdown path at all**. **The crash path *is* the shutdown path.**

---

## Factor 10: Dev/prod parity
> **Keep development, staging and production as similar as possible.** (Parity = sameness.)

### The three gaps
| Gap | Traditional app | Twelve-factor app |
|---|---|---|
| **Time** | Code written today reaches prod Friday or next week, **with lots of other changes at once** | Deploy **every few hours** |
| **Personnel** | Different people **write**, **deploy**, and **see the errors** (ops) | **The people who write it deploy it** and watch the logs |
| **Tools** | Dev on **macOS/Windows** (Docker or native installs) vs prod on **Linux** with external backing services | **Environments as similar as possible** |

- Shrink all three and **continuous deployment becomes smooth.**
- Time and personnel gaps are **largely closed** today. **The tools gap still exists.**

### The SQLite trap
- Common practice: **lightweight DB in dev (SQLite), Postgres in prod**, made easy by **ORMs** (**Drizzle, Prisma** for Node; **GORM** for Go; **SQLAlchemy** for Python) that abstract the database.
- **But:**
  - Postgres **`LIKE` is case-sensitive** (`ILIKE` is the case-insensitive one).
  - SQLite **`LIKE` is case-insensitive by default for ASCII.**
- A search built and tested locally on SQLite will **behave differently in production.**
- **The dangerous part: no error, no warning, no log.** **The behaviour just silently changes.**

```sql
-- dev (SQLite):    SELECT * FROM tasks WHERE title LIKE '%report%';   -- matches "Report", "REPORT"
-- prod (Postgres): same query                                         -- only matches lowercase "report"
```

**Advice:** **use the same backing services** (DB, cache, queue) in **local, staging and production**. In 2026 there's no excuse: **one command starts a container.**

### But 2026 isn't that clean either
- **Docker / Docker Compose** made local ≈ prod for a while (same containers).
- Then **managed services** arrived. **AWS DynamoDB** **can't run locally.** Emulators like **LocalStack** cover many AWS services, but it's **not the same implementation**: DynamoDB is **proprietary**, and emulators only copy **documented** behaviour.
- **Nuanced takeaway:** managed services bring huge benefits (scaling, not running your own infra, cost). **If the benefit outweighs the dev/prod gap, use them**, and accept that gap knowingly.

---

## Factor 11: Logs
> **Treat logs as event streams.**

- Historically "logs" means **a log file**. The document says **the file was never the log.** It's just **one output format.**
- **A log is a time-ordered stream of events**, flowing **as long as the app runs**, with **no beginning and no end**.
- **The app must not route or store that stream**: no log file paths, no log rotation.
- **Prescription:** write every event, **unbuffered, to stdout.** **The execution environment** (platform or orchestrator) **captures the stream** and decides where it goes: a file, or a **log drain** (an external service for storage and analysis).

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))   // stdout, nothing else
logger.Info("task moved", "board", 412, "task", "t-9")
```

### Why the split
1. **No code changes when I deploy somewhere new.** Logging destination becomes **config / platform**. 2011: stdout → **syslog**. Today: stdout → **Loki** or **Datadog**. Same pattern.
2. **Streams compose; files don't.** Same stdout, different setups:

```
laptop      → logs live in my terminal
container   → runtime captures the stream, stamps WHICH PROCESS it came from → collector
production  → platform merges ALL instances' streams into ONE time-ordered stream
              (no "which instance was that on?" — just when it happened)
```

### Modern addition
- Today: **observability = logs + metrics + traces.** The 2011 text only mentions **logs** because metrics and tracing **weren't common practice** then.
- Treat metrics and traces as **additions**. The factor doesn't limit me.

---

## Factor 12: Admin processes
> **Run admin/management tasks as one-off processes.**

- **One-off process:** a task run **once**, **alongside** the long-running processes, that then **exits**.
- Examples next to an HTTP backend: a **DB migration**, a **script to fix data in production**.
- **It must run in an identical environment** to the regular processes:
  - **same codebase, same commit** (ships with the deploy)
  - **same config**
  - **same dependency isolation**

**Why so strict:** the old way was **SSH into the server and run an `UPDATE`/`DELETE` by hand**: **no code review, no record, no logs** → **drift** between production and what's in the code.

**Classic example: database migrations** ship with the same code, run as a **one-off process before the app starts**, then exit.

```bash
# same image, same config, one-off — then it exits
kubectl run migrate --rm -it --image=tasker:release-102 --env-from=configmap/tasker -- ./tasker migrate up
heroku run ./tasker archive-old-tasks
```

---

## Demo: factors 8, 9 and 12 in practice

The **Tasker** task app backend on a Linux box (over SSH), driven by a **Procfile** (a Heroku invention for declaring process types):

```
Pane 1:  overmind start          ← process manager starts the formation (factor 8)
         → schema check
         → background job server starts
         → server binds to its assigned port   (factor 7)
         → logs streaming to stdout            (factor 11)

Pane 2:  one-off admin process: auto-archive   (factor 12)
         same code, same config, same environment → runs → exits

Pane 1:  Ctrl-C                                (factor 9)
         → DB connection pool closes
         → job server waits for its workers to finish their jobs
         → process reports a clean exit
```

---

## How each factor aged

*(My summary of his verdicts.)*

| # | Factor | Verdict |
|---|---|---|
| 1 | Codebase | Revision control is universal. **Monorepos are fine**; copy-paste sharing is the anti-pattern |
| 2 | Dependencies | Lock files made it stronger. **Docker practically solved it** |
| 3 | Config | Separation is **non-negotiable**. Env vars are the right default, **but secrets → secret manager** as you grow |
| 4 | Backing services | **Aged very well**, practically a prediction (managed everything) |
| 5 | Build, release, run | Universal (Heroku releases, image tags, k8s rollouts). Immutability now **mandatory** in the rewrite |
| 6 | Processes | Still the default. **Sticky sessions are a violation.** Real-time/WebSocket state is the allowed exception |
| 7 | Port binding | Obvious now. **Serverless** doesn't bind ports, so the rewrite generalises to "a declared interface" |
| 8 | Concurrency | **Absorbed by orchestrators** (replicas). Still direct with systemd |
| 9 | Disposability | **More important than ever** (constant deploys/scaling). Crash-only design |
| 10 | Dev/prod parity | Time and people gaps closed. **Tools gap persists** (SQLite vs Postgres, proprietary managed services) |
| 11 | Logs | Stdout is universal. Observability adds **metrics + traces** |
| 12 | Admin processes | Migrations are the canonical example. **No SSH-and-run-SQL** |

---

## My cheat sheet

```
WHAT       contract between my app and the platform (Heroku, Adam Wiggins, 12factor.net, 2011)
           → any machine / platform / teammate can run, scale, update it with no surprises
           assumed by Heroku, Docker, k8s, Render, Railway, Fly, Cloud Run, App Runner, Vercel, Netlify
WHY        2011 = snowflake servers (hand-built, FTP, SSH-edited config) → SOFTWARE EROSION
           (OS patches, shared libs, the person who knew leaves) · "works on my machine"
2024       open-sourced by Heroku/Salesforce (KubeCon Nov 2024), neutral org, AWS + GCP maintainers
           rewrite on branch "next": same 12 names/mottos, numbered principles, unmerged draft

 1 CODEBASE     one repo, many deploys (prod/staging/PR/laptop at different commits)
                code shared, CONFIG differs · copy-paste sharing ✗ → library · monorepo of N apps ✓
 2 DEPS         DECLARE (manifest + LOCK file) + ISOLATE (venv, bundle exec; no system leaks)
                ImageMagick v6 `convert` vs v7 `magick` · Docker ≈ solved it
 3 CONFIG       whatever differs per deploy → env vars, granular, never grouped into "modes"
                test: could I open-source the repo right now without leaking a credential?
                secrets leak via env (child procs, crash pages, /proc/<pid>/environ — Mónica 2017)
                → small team: platform secrets OK · growing: Vault / Parameter Store, load at boot, rotate, audit
 4 BACKING SVC  DB/Redis/queue/SMTP/S3/3rd-party = attached resources via handle (URL + creds)
                swap local Postgres ↔ RDS/Neon/PlanetScale/Supabase with zero code change
                postgres://user:pass@host:5432/db
 5 BUILD/REL/RUN build = code + deps (no config) · release = build + config, immutable, append-only, IDs
                rollback = re-run an old release in seconds · no hot-patching prod
 6 PROCESSES    stateless, share-nothing · temp files OK within one transaction
                sticky sessions = violation → sessions in Redis/Postgres
                WebSockets = allowed exception (the feature IS the state)
                rule: can't kill any process anytime w/o data loss → misplaced state
 7 PORT BINDING self-contained, HTTP server is a library, bind $PORT (vs app-inside-Apache/Tomcat)
                any app can be another's backing service · serverless → "declared interface"
 8 CONCURRENCY  scale by PROCESS (threads/goroutines inside are fine) · types: web / worker / scheduler
                formation (web=10, worker=2 at lunch; web=5, worker=20 at night) · Procfile / replicas: 3
                never daemonize, no PID files — the platform manages lifecycles
 9 DISPOSABLE   seconds to start (60 s boot → 10 min rolling deploy, late autoscaling)
                SIGTERM: web drains in-flight · worker returns the job to the queue
                re-entrant jobs = transaction or idempotent · survive OOM/crash → crash-only design
10 PARITY       close time / personnel / tools gaps · same backing services everywhere
                SQLite LIKE (case-insens.) vs Postgres LIKE (case-sens.) = silent bug
                proprietary managed (DynamoDB vs LocalStack) → accept the gap if benefit is large
11 LOGS         event stream, unbuffered to stdout · platform routes it (syslog then, Loki/Datadog now)
                streams compose (terminal · container stamps process · prod merges instances)
                + metrics + traces today
12 ADMIN        one-off processes (migrations, data fixes) with same code, commit, config, isolation
                never SSH + ad-hoc SQL (no review, no record → drift)
DEMO           Procfile + overmind: schema check → job server → bind port → stdout logs
               one-off auto-archive → exits · Ctrl-C → pool closes, workers finish, clean exit
```
