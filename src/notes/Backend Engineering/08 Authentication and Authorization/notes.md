# My Notes: Authentication and Authorization for Backend Engineers

> **Source:** "8. Authentication and authorization for backend engineers" by Sriniously, *Backend from first principles* playlist (YouTube, 1:35:57)
> **Link:** https://www.youtube.com/watch?v=A95rliroC8Q
>
> I wrote these from the video's full caption track, organised and worded my own way. The diagrams and sample tokens/requests are my own illustrations of what he explains.

---

## 1. The two questions

He calls this his favourite topic, and it's one I use every day: every sign-up and login screen is an authentication flow.

| | Question it answers | Technical framing |
|---|---|---|
| **Authentication** | **Who are you?** | Assigning an identity to a subject in a given context (a platform, an OS, a phone…) |
| **Authorization** | **What can you do?** | Working out your capabilities / permissions in that context |

```
            ┌───────────────────┐        ┌────────────────────────┐
 request ─► │ AUTHENTICATION    │ ─────► │ AUTHORIZATION          │ ─► allowed / 403
            │ "who are you?"    │        │ "what can you do?"     │
            └───────────────────┘        └────────────────────────┘
```

---

## 2. A short history of authentication

This background helps me see why the modern methods look the way they do.

```mermaid
timeline
    title How authentication evolved
    Pre-industrial : Implicit trust - a respected person vouches, deals sealed with a handshake
    Medieval : Wax seals - "something you HAVE", first tokens, forgery = first bypass attacks
    Industrial era : Telegraph pass-phrases - shared secrets, "something you KNOW"
    1961 MIT CTSS : First computer passwords, stored in plain text, leaked when the file was printed
    Post-1961 : Hashing - irreversible fixed-length password storage
    1970s : Diffie-Hellman - asymmetric crypto and PKI, Kerberos ticket-based auth
    1990s : MFA - know + have + are, biometrics
    21st century : OAuth, OAuth 2.0, JWT, zero trust, passwordless (WebAuthn)
    Future : Decentralised identity, behavioural biometrics, post-quantum crypto
```

### Pre-industrial: implicit trust
- Identity was the same as **being recognised**. Someone already respected (a village elder, say) could vouch for you, and a **handshake** sealed the deal.
- This is authentication based on **human, contextual trust**.
- **It didn't scale.** Once interactions went beyond familiar circles, that elder wasn't trusted everywhere. People needed **explicit** proof that worked without personal acquaintance.

### Medieval: seals
- **Wax seals** with unique patterns acted as signatures on letters and agreements, an early cryptographic mechanism.
- They were the first widely used **authentication tokens**: physical proof of identity based on **possession** ("something you have").
- Weakness: **forgery**, essentially the first **authentication bypass attacks** (getting past authentication with malicious intent).
- That pushed people towards watermarks and encrypted codes in trade documents, the start of **cryptographic thinking**.

### Industrial era: pass-phrases and shared secrets
- Communication systems advanced alongside machines. The **telegraph** became critical infrastructure and needed secure message validation.
- Operators used **pre-agreed pass-phrases**, an early **shared secret**. They were static, like a fixed password.
- The principle shifted from **something you have** to **something you know**, which is more secure and the ancestor of the password.

### Mainframes: the first digital authentication
- **1961, MIT Project MAC, CTSS (Compatible Time-Sharing System):** passwords were introduced so multiple users could share one computer without seeing each other's data.
- They were stored in **plain text**. The flaw came to light when someone **printed the password file**.
- That incident started the idea of **secure password storage**, which led to **hashing**.

**Hashing, as I understand it:**
```
plain text  ──►  [ hash algorithm ]  ──►  fixed-length string
"abc"                                     "ba7816bf8f01cfea..."
"a 100-character string..."               "9f86d081884c7d65..."   (same length)
```
- **Irreversible.**
- **Fixed length** no matter how long the input is.
- **Deterministic:** the same input always gives the same hash.
- Authentication started aligning with the **CIA triad: confidentiality, integrity, availability**, the core tenets of information security.

### 1970s: the cryptography boom
- **Whitfield Diffie and Martin Hellman** created the **Diffie–Hellman key exchange**, introducing **asymmetric cryptography**: two parties can set up a **shared secret over an untrusted channel**.
- Asymmetric crypto became the backbone of modern authentication protocols, also known as **PKI (public key infrastructure)**.
- **Kerberos** arrived: **ticket-based** authentication where a **trusted third party** issues tickets that verify both user and service. It's a precursor to today's **token-based** auth.

### 1990s: internet growth and MFA
- Username + password wasn't strong enough against new **brute-force** and **dictionary** attacks.
- **MFA (multi-factor authentication)** combined factors:

| Factor | Examples |
|---|---|
| **Something you know** | Password, PIN |
| **Something you have** | Smart card, OTP generator |
| **Something you are** | Biometrics: fingerprint, retina scan |

- **Biometrics** use pattern recognition and statistical models, but bring their own problems: **false positives/negatives** and **template security**. Not a one-step fix.

### 21st century: modern times
Cloud computing, mobile devices, and API-based architectures needed more advanced frameworks. The main ones:
- **OAuth / OAuth 2.0** (still the most popular)
- **JWTs**
- **Zero-trust architecture**
- **Passwordless** auth (e.g. **WebAuthn**): no passwords at all, relying on public/private keys stored in hardware

### The future (as of the recording)
- **Decentralised identity**, e.g. built on blockchain. Promising, still experimental.
- **Behavioural biometrics.**
- **Post-quantum cryptography:** once quantum computers are common, they could break today's algorithms (RSA and other public/private key schemes) that are only safe because current hardware can't crack them. Post-quantum techniques are designed to stay secure even against quantum computers, and some already exist.

---

## 3. Three building blocks: sessions, JWTs, cookies

These come up throughout auth flows, so I need them clear first.

### 3.1 Sessions

**Why they exist:**
- HTTP is **stateless** by design: each request is isolated, with no memory of earlier ones.
- That was fine for the early web of **static pages** people just read. No continuity needed.
- Once the web became **dynamic**, statelessness became a **bottleneck**:
  - How does an e-commerce site remember what's in my **cart**?
  - How do I **stay logged in** while moving between pages?
- That's where **stateful interactions** and **sessions** came in: a **temporary, server-side context** per user, so the server remembers me on the next request.

**How a session works:**

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as Server
    participant St as Session store (DB / Redis)
    B->>S: login
    S->>S: create unique session ID
    S->>St: save {sessionId → user data, role, cart, authenticated?, expiry}
    S-->>B: Set-Cookie: sessionId=abc123
    B->>S: next request (Cookie: sessionId=abc123 sent automatically)
    S->>St: look up abc123
    St-->>S: user data
    S-->>B: personalised response
    Note over S,St: session expires (e.g. 15 min) → a new session is created
```

1. **Creation:** on login, the server generates a **unique session ID** and stores it with the user data it needs repeatedly (role, name, cart items, whether authenticated) in a **persistent store**: a database, or **Redis** (in-memory, faster than a file-based DB).
2. **Session ID to the client:** sent to the browser **as a cookie**. Every later request carries that cookie, and the server uses the ID to fetch the data from the store. This gives the server **memory** for each user.
3. **Expiry:** sessions are **short-lived**, e.g. 15 minutes. After expiry, the server creates a new session, stores the data again, and sends a new ID.

**How session storage evolved:**

```
File-based sessions ─► Database-backed sessions ─► Distributed in-memory stores
(simple, didn't scale)  (faster lookups, survive    (Redis, Memcached: RAM-based,
                         server restarts)            faster than DB lookups)
```

Sessions are still used today for exactly this purpose: giving servers memory.

### 3.2 JWTs (JSON Web Tokens)

**Why they appeared (mid-2000s):** web apps became **globally distributed**, and stateful sessions became a bottleneck:
1. **Memory:** keeping session data for millions of users was expensive.
2. **Replication:** syncing session data across servers in different regions (even opposite sides of the world) added **latency** and **consistency** problems.

Developers wanted to **offload state from the server** while keeping security and integrity. JWTs were **formalised in 2015** as a **stateless** way to transfer **claims** between two parties or systems.

**Key innovation: self-contained tokens.** One token holds the user data (ID, role…) **plus** a cryptographic **signature**, all **Base64-encoded**. He shows one on **jwt.io**.

```
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiIxMjMiLCJpYXQiOjE3MDAwMDAwMDAsInJvbGUiOiJhZG1pbiJ9 . SflKxwRJSMeKKF2QT4fw...
└──── HEADER ───────┘   └──────────────────────── PAYLOAD ─────────────────────────┘   └──── SIGNATURE ─────┘
```

| Part | Contains |
|---|---|
| **Header** | Metadata about the token itself, e.g. the **signing algorithm** used |
| **Payload** | The data I actually need: **`sub`** (subject = user ID, from my DB, an auth provider, any context), **`iat`** (issued at), plus optional fields like `name`, `role` (admin / member / editor / viewer…) |
| **Signature** | Proves **I issued it** and it **hasn't been tampered with**. Made with a **secret key** only I hold. If anyone changes the token, verification with my key fails |

```json
// decoded header
{ "alg": "HS256", "typ": "JWT" }

// decoded payload
{ "sub": "123", "iat": 1700000000, "name": "Dilip", "role": "admin" }
```

So verifying a user becomes **stateless**: no session storage, a lightweight check on every request, lower storage cost.

**Advantages:**
| Advantage | Why |
|---|---|
| **Statelessness** | No server-side storage cost |
| **Scalability** | In microservice/distributed setups, a cookie from one server doesn't work for a server on another domain. With JWTs, every server holding the **shared secret** can verify the user, so I can scale to many instances without worrying about auth |
| **Portability** | Lightweight, URL-friendly Base64 string. Fits in cookies, URLs, and other limited-space storage (also local storage, though **I shouldn't**) |

**Challenges:**
1. **Token theft:** with no server-side state, anyone who gets my JWT can **impersonate me** until it expires. The only way to kill it early is to **change the server's secret**, which logs out **every** user just to invalidate one token.
2. **Revocation:** I can't revoke a specific user's access, since I have no way to track a stateless token's status until it expires.

**The hybrid fix and its contradiction:**

```
Normal JWT flow:   verify signature with secret → read user ID → done (no storage lookup)

Hybrid flow:       verify signature → THEN check a BLACKLIST in DB/Redis
                   → can block hacked/malicious users temporarily
```

- The blacklist lets me revoke access, e.g. when an account is hacked or a user acts maliciously.
- **But:** the whole point of JWTs was statelessness. If I'm doing a storage lookup anyway, why not go stateful from the start, which is also considered more secure? That's a question that comes up often in the industry.

**His advice:**
- For **medium-to-large production systems**, use an **auth provider** (e.g. **Auth0**, or newer ones like **Clerk**). Choosing the techniques, algorithms, hashing, salting and so on, and keeping it all secure, becomes their problem.
- While **learning** backend, **build my own auth** to understand the parts and trade-offs.
- In production, go with a provider **unless I'm very confident** in my auth workflows.

### 3.3 Cookies

- A **cookie** stores a piece of information (any string or value) **in the user's browser, set by the server**. That server-side ability is the key point.
- **Browser security feature:** a cookie is only accessible to the server that set it. Servers can't see each other's cookies.
- A cookie set by a server is **automatically sent with every later request to that server**.

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as Server
    B->>S: POST /login (username + password)
    S->>S: verify credentials
    S-->>B: Set-Cookie: token=<session ID or JWT>
    Note over B: browser stores the cookie
    B->>S: GET /notes  (Cookie: token=... attached automatically)
    S->>S: validate token → identify + authorize user
    S-->>B: 200 OK
```

This **automates** the token round trip: the server hands the client the token and gets it back on every request, all controlled from the server side.

---

## 4. Types of authentication

```mermaid
mindmap
  root((Authentication types))
    Stateful
      session ID + store
    Stateless
      signed JWT
    API key
      machine to machine
    OAuth 2.0 / OIDC
      delegation + third-party login
```

---

## 5. Stateful authentication

```mermaid
sequenceDiagram
    participant C as Client (browser)
    participant S as Server
    participant R as Redis / DB
    C->>S: 1. username/email + password
    S->>S: 2. check credentials are valid
    S->>R: 3. store {session ID → user data}
    S-->>C: 4. Set-Cookie (HttpOnly): sessionId=...
    C->>S: 5. later request, cookie attached automatically
    S->>R: 6. does the session exist? expired? whose is it?
    R-->>S: user data
    S-->>C: 7. API response (identified + authorized)
```

1. The client sends credentials (username/email + password).
2. The server checks they're valid and that the user may log in.
3. The server creates a **session ID**, bundles it with the user data, and stores it, usually in **Redis** because reads are much faster than a traditional DB.
4. It sends the session ID back in an **`HttpOnly` cookie**, so **JavaScript can't read it**.
5. Because cookies attach themselves to later requests, each request carries the session ID.
6. The server takes the ID, checks it exists in Redis, checks expiry, gets the user data, identifies and authorizes the user.
7. The user can call the API.

The session ID can be any cryptographically random string, or even a JWT, depending on the implementation.

---

## 6. Stateless authentication

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server (holds SECRET KEY)
    C->>S: 1. email + password (login)
    S->>S: 2. verify credentials
    S->>S: 3. create JWT {sub, role, ...}, sign with secret
    S-->>C: 4. JWT
    C->>S: 5. request + Authorization: Bearer <JWT>
    S->>S: 6. verify signature with secret → read user ID
    alt valid
        S-->>C: 200 OK
    else invalid
        S-->>C: 401 Unauthorized / 403 Forbidden
    end
```

1. The client logs in with credentials.
2. The server verifies them.
3. The server creates a **signed JWT** with the user's info (ID, role…) using its **secret key**, which must be **stored securely** because it both signs and verifies tokens.
4. The JWT goes back to the client.
5. On later requests, the client sends it, by convention in the **`Authorization`** header (though other ways are possible).

```http
GET /api/notes HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.SflKxw...
```

6. The server extracts and verifies the token with its secret. If that works, authentication succeeds. If not, it returns **unauthorized** / **forbidden** (whatever the convention is).

**Why "stateless":** stateful auth needs a persistent-store lookup. Stateless auth keeps everything it needs **inside the signed token**, and the secret key proves it's authentic. The token is **self-contained**.

---

## 7. Stateful vs stateless: which one?

| | **Stateful** | **Stateless** |
|---|---|---|
| **Pros** | **Centralised control**; real-time view of all active sessions; easy to **revoke** a session or log a user out; suits apps with moderate traffic and strict session needs | **Scalability**; no session-store dependency; ideal for **distributed** systems; **mobile-friendly** (where cookies don't really apply) |
| **Cons** | Limited **scalability**; more operational complexity across regions; **latency** in distributed setups | **Token revocation is hard**: once issued, a JWT can't be revoked before expiry except by rotating the secret, which logs everyone out |

**His opinion:** most applications should go **stateful**, for the security and the ease of revoking access with real-time visibility.

**A hybrid approach that gets the best of both:**

```
                        ┌──────────────────────────────┐
  Browser web app ────► │ STATEFUL auth (session+cookie)│
                        │                               │   same backend
  Mobile apps / 3rd ──► │ STATELESS auth (JWT)          │
  party integrations    └──────────────────────────────┘
```
- The main **browser web app** uses **stateful** auth.
- **Mobile apps** and **third-party / server integrations** use **stateless** auth for scalability and simplicity.

---

## 8. API key authentication

A completely different use case from stateful/stateless auth.

### How it works
1. In a platform's UI, I click **"Generate API key."**
2. I get a **cryptographically secure random string**.
3. I use that string to access **the server behind that UI directly**, programmatically.

### The ChatGPT example
- Normally I type in ChatGPT's UI, and many servers in the cloud produce the response the UI renders.
- OpenAI also offers **API keys** for people who want **programmatic access** to the models (GPT-4, GPT-3.5…) instead of the ChatGPT UI, for example to build their own UI or to use the responses inside their own server.
- So API keys give **access to the server, not the UI or platform**, to other users in a controlled way: **scoped by permissions**, with **expiry**.
- I attach the key to requests (in a header, or however the server expects it), and I can do programmatically what the native platform does.

```http
POST /v1/chat/completions HTTP/1.1
Host: api.example-ai.com
Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

### Advantages
1. **Easy to generate:** click a button, done.
2. **Ideal for machine-to-machine communication.**

### Client-to-server vs machine-to-machine
```
CLIENT ↔ SERVER (human)                      MACHINE ↔ MACHINE (no human)
┌──────┐ mouse/keyboard ┌──────┐            ┌────────────┐  API key   ┌───────────────┐
│  UI  │ ─────────────► │server│            │ MY server  │ ─────────► │ AI provider   │
└──────┘ ◄───rendered── └──────┘            └────────────┘ ◄─response─ │ server        │
   visual, needs login form,                   code only, key stored    └───────────────┘
   typing, token handling                      in env var / secure storage
```

**Example:** a user types a paragraph in **my** UI and asks for a summary → my server calls ChatGPT's server **with my API key** → their server identifies me (plan, remaining quota, access) from the key → returns the summary → my server sends it to my UI.

- Stateful/stateless auth needs **human triggers**: typing credentials into a login form, getting a token, storing it.
- With machine-to-machine, I just give the machine a **secret key**. It keeps it in an **environment variable** or secure storage and sends it with every request. **That's why API keys fit programmatic access.**

---

## 9. OAuth and OpenID Connect

### 9.1 The problem: too many passwords
Every site needed its own account, so the more sites I used, the more credentials I had to manage.
1. **Security risk:** people **reused passwords** (`12345`, `password`), so **one breach compromised many accounts**. (Password managers and generators help now.)
2. **Fatigue:** managing lots of accounts was overwhelming.

### 9.2 The delegation problem
Sites started needing **access to another site's resources**:
- A **travel app** wants to scan my **Gmail** for flight tickets.
- A **social media app** wants to **import my contacts** from another platform (e.g. Google Contacts).

**The first "solution": share your password.** It was a disaster:
- Sharing a password gives **full access** to everything, with **no way to limit permissions**.
- **Revoking** meant changing my password, and since people reused passwords, changing it **everywhere**. Another platform now held my password and could do anything.

### 9.3 OAuth 1.0 (2007): share tokens, not passwords
- **OAuth = Open Authorization.** A revolutionary idea as much as a protocol.
- Engineers from companies like **Google and Twitter** standardised a way to share access **without sharing passwords**.
- **The idea: tokens with specific permissions.**

```
PASSWORD  → full access: photos, maps history, contacts (read/add/delete), calendar, everything
TOKEN     → scoped access: e.g. READ contacts only (no add, no delete, nothing else)
```

**The four roles:**
| Role | Who | In the example |
|---|---|---|
| **Resource owner** | The user who owns the data | **Me** |
| **Client** | The app requesting access | **Facebook** (wants my contacts) |
| **Resource server** | Where the data lives | **Google** (my contacts) |
| **Authorization server** | Issues tokens after authenticating the user | Google's auth server |

**OAuth 1.0 flow:**
```mermaid
sequenceDiagram
    actor U as Me (resource owner)
    participant C as Client (Facebook)
    participant A as Authorization server (Google)
    participant R as Resource server (Google Contacts)
    C->>U: 1. redirect to authorization server
    U->>A: 2. log in + grant permissions ("Yes, allow reading contacts")
    A-->>C: 3. token
    C->>R: 4. request contacts with token
    R-->>C: contacts (only what was permitted)
```

That solved password sharing.

### 9.4 OAuth 2.0 (~2010)
**OAuth 1.0's limitations:**
1. **Complex** for developers to implement.
2. Relied on **cryptographic signatures**, which were **error-prone**.

**What OAuth 2.0 changed:**
1. **Bearer tokens:** much simpler to implement (somewhat more vulnerable, but easier).
2. **Different flows for different app types:**

| Flow | For |
|---|---|
| **Authorization code flow** | **Server-side apps** |
| **Implicit flow** | Browser-based apps. **Now discouraged** because of security risks |
| **Client credentials flow** | **Machine-to-machine** (server ↔ server, no user or browser) |
| **Device code flow** | **Limited-input devices** without keyboard/mouse, e.g. **smart TVs** |

### 9.5 OpenID Connect (OIDC, ~2014): adding authentication
- **OAuth solves authorization** (what you can do, via delegation) but **not authentication** (who you are).
- **OIDC** is built **on top of OAuth 2.0** to fill that gap.
- It adds an **ID token**, which is a **JWT** (one reason JWTs were explained first: they keep showing up in auth).

```json
// ID token payload (illustrative)
{
  "sub": "1098765",                         // user ID
  "iss": "https://accounts.google.com",     // issuing authority
  "iat": 1700000000,                        // when they logged in
  "name": "Dilip Kumar",
  "email": "dilip@example.com",
  "picture": "https://..."
}
```

- This powers **"Sign in with Google / Facebook / Discord."** The platform takes my identity (email, name, profile picture, whatever it asked for) from Google and uses it to authenticate me **without its own login mechanism**.

**OIDC flow (note-taking app + "Sign in with Google"):**
```mermaid
sequenceDiagram
    actor U as Me
    participant C as Note-taking app (client)
    participant A as Google authorization server
    participant R as Google resource server (e.g. Keep)
    U->>C: click "Sign in with Google"
    C->>A: redirect me to Google
    U->>A: log in on GOOGLE's page + grant requested permissions (email, name, picture, Keep notes)
    A-->>C: authorization code (+ ID token in some flows)
    C->>A: exchange authorization code
    A-->>C: ACCESS TOKEN + ID TOKEN (JWT with my id, name, email...)
    C->>R: fetch my Keep notes using the access token (on my behalf)
    R-->>C: notes (only what was permitted)
```

1. I click **Sign in with Google** in a note-taking app (the client).
2. The client **redirects** me to Google's **authorization server**.
3. I log in **on Google's side, not the client's**, and grant the requested permissions.
4. The auth server sends the client an **authorization code** (and, in some flows, an ID token already).
5. The client **exchanges the code** for an **access token** (plus the ID token if it didn't have it yet).
6. The **ID token** (a JWT) has my ID, name, and other details. The **access token** lets the client act **on my behalf**, e.g. fetch my Google Keep notes, but **only** what I allowed.

**My takeaway:** OAuth 2.0 + OIDC are like the **security guards / key-makers of the digital age**. Nobody, user or platform, gets more access than they asked for and were granted. Together they took the internet from **password-sharing chaos** to a secure, interconnected system with integrations and resource and permission sharing between platforms.

---

## 10. When to use which

| Method | Best for |
|---|---|
| **Stateful** (session ID / token + persistent store) | **Web apps**, which covers most SaaS. User-specific session data lives on the server |
| **Stateless** (JWT) | **APIs** and **scalable, globally distributed** systems where the token carries the user info |
| **OAuth / OIDC** | **Third-party integrations** and **login via external providers** (Google, Facebook, Discord…) |
| **API key** | **Server-to-server / machine-to-machine**, or single-purpose client access to APIs |

In his experience, I'll use **stateful and stateless** most of the time when building APIs.

---

## 11. Authorization and RBAC

Smaller than authentication, but I need a high-level idea.

**Reminder:** authentication = **who** the user is; authorization = **what** they can do.

### Why it's needed: the note-taking example
- Users log in and can create, update, and delete notes.
- **Deleting doesn't remove notes permanently.** They go to a **trash**, where the user can delete permanently, or they auto-delete after **30 days**.
- After 30 days they move to a hidden zone he calls the **"dead zone"**: gone for the user, still in the database.
- **I, the creator/admin**, want my own **admin UI** to work with dead-zone notes, a capability **regular users must not have**.

**Naive solution: a secret "god-mode" string sent with each API request.**
1. **Security risk:** if someone intercepts it, they can wipe the DB or tamper with other users' data.
2. **Doesn't scale:** to give the same access to friends or maintainers, I'd share the string or create more strings with server support for each, which gets complicated and even less secure.

**That's what authorization solves:** giving **specific permissions to specific users**. Not everyone has the same access; some have more, some less, some completely different sets. In **multi-tenant** apps (organisations), an **admin** might give some members **read + write** and others **read only**.

### RBAC: role-based access control
The most widely used technique, and one I should know.

```
ROLES                 PERMISSIONS
┌──────────┐          ┌──────────────────────────────────┐
│ user     │ ───────► │ notes: read, write, delete       │
├──────────┤          ├──────────────────────────────────┤
│ moderator│ ───────► │ notes: read, write               │
├──────────┤          ├──────────────────────────────────┤
│ admin    │ ───────► │ notes: read, write, delete       │
│          │          │ dead-zone notes: read, write     │ ← admin only
└──────────┘          └──────────────────────────────────┘
        (custom roles possible; as granular as needed, per resource)
```

**RBAC flow:**
```mermaid
sequenceDiagram
    participant U as User
    participant S as Server (auth middleware)
    participant H as Handler (dead-zone API)
    U->>S: sign up
    S->>S: assign role (e.g. "user" or "admin")
    U->>S: request + session ID / JWT
    S->>S: identify user → find role (from token or DB lookup)
    S->>H: pass request along with role attached
    alt role == admin
        H-->>U: 200 OK (dead-zone notes)
    else role == user
        H-->>U: 403 Forbidden
    end
```

1. A user signs up, and the server **assigns a role**.
2. On later requests, the user sends their identification (session ID for stateful, JWT for stateless).
3. **Early in the request cycle**, the server works out the role from the token or a DB lookup and **attaches it** for the next middlewares. (Middleware chains get their own future video.)
4. Later logic checks the role. Admin → access to dead-zone notes. User → **403 Forbidden** (not enough permission).

---

## 12. Security: error messages

**Tempting "friendly" messages during login:**
- "User not found"
- "Incorrect password"
- "Account locked due to too many failed attempts"

They help real users, but they also **hand attackers clues**:
- **"User not found"** → the attacker knows that username doesn't exist and moves on to the next one on their list.
- **"Incorrect password"** → the attacker knows the **username is valid**, so now it's just the password: brute force or dictionary attacks with a smaller search space.

**Rule: always send a GENERIC message in authentication flows**, e.g. **"Authentication failed"**, for every failure case, so an attacker can't tell what to try next. Friendly, specific errors are fine elsewhere (validation, other APIs), **just not in auth.**

```
❌ "User not found"            ❌ "Incorrect password"           ❌ "Account locked"
✅ "Authentication failed"     (same message for all of them)
```

---

## 13. Security: timing attacks

Rare, but real.

### Typical login steps
```
1. Find the user by username/email         ──► not found? return early (FAST)
2. Check whether the account is locked/suspended
   (after several failed attempts: 2 min, 4 min, a day...)
3. Hash the given password with the same algorithm/key,
   compare it to the stored hash from the DB ──► mismatch? return (SLOWER, hashing takes time)
```

- Passwords are never stored in plain text. They're **hashed** at sign-up, and even the server can't recover the plain text. To check a login, it hashes the given password the same way and compares the two hashes.

### The leak
- **Invalid username** → fails at step 1 → **fast** response.
- **Valid username, wrong password** → fails at step 3 after **hashing** → **slower** response (say ~200 ms more).
- By measuring response times, attackers can tell **which step failed**, and so whether the **username is valid**, then focus brute-force or dictionary attacks accordingly.

```
Invalid username : |██|                         fast
Wrong password   : |██████████████|             slower (hashing)
                   ↑ attacker measures this difference
```

### Defences: equalise response times
1. **Constant-time operations:** cryptographically secure **constant-time comparison** functions for password hashes, whose execution time doesn't depend on how similar the inputs are.
2. **Simulated delay:** add an artificial delay on the fast path (Node: `setTimeout`; Go: `time.Sleep`) so a missing user also takes ~200 ms and the timings can't be told apart.

```js
// idea only
if (!user) {
  await sleep(200);              // fake the time hashing would have taken
  return res.status(401).json({ error: "Authentication failed" });
}
```

---

That's authentication and authorization as a backend engineer needs it. **Next video: validations and transformations.**

---

## 14. My cheat sheet

```
AUTHENTICATION = who are you?        AUTHORIZATION = what can you do?

HISTORY
  trust/handshake → wax seals (have) → pass-phrases (know) → 1961 CTSS plain-text passwords
  → hashing → Diffie-Hellman / PKI / Kerberos tickets → MFA (know+have+are)
  → OAuth, JWT, zero trust, passwordless → decentralised ID, post-quantum

SESSIONS   server-side memory; session ID in cookie; data in DB/Redis; short-lived
JWT        header.payload.signature (Base64); sub, iat, role...; signed with secret
           + stateless, scalable, portable   − theft, no revocation (rotate secret = logout all)
           hybrid = JWT + blacklist lookup (but then why not stateful?)
COOKIES    set by server, stored in browser, auto-sent to same server; HttpOnly = no JS access

STATEFUL   creds → session in Redis → HttpOnly cookie → lookup each request
           + control, revocation, visibility   − scaling, multi-region latency
STATELESS  creds → signed JWT → Authorization: Bearer → verify with secret
           + scale, no store, mobile-friendly  − hard revocation
HYBRID     web app = stateful; mobile/3rd party = stateless

API KEYS   generate in UI → random secure string → machine-to-machine (env var)
OAUTH      delegation: tokens with scoped permissions instead of passwords
           roles: resource owner · client · resource server · authorization server
           2.0: bearer tokens + flows (auth code, implicit✗, client credentials, device code)
OIDC       OAuth 2.0 + ID token (JWT) → "Sign in with Google"
           code → exchange → access token + ID token

WHEN       web app → stateful · APIs/distributed → stateless
           third-party login → OAuth/OIDC · server↔server → API key
PRODUCTION use an auth provider (Auth0, Clerk...) unless very confident

RBAC       roles → permissions per resource; role resolved early (middleware)
           not permitted → 403 Forbidden

SECURITY   generic auth errors only ("Authentication failed")
           timing attacks → constant-time compare + simulated delay
```
