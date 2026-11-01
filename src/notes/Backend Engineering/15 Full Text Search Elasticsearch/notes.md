# My Notes: Full-Text Search with Elasticsearch

> **Source:** "15. Full text search using Elasticsearch for blazingly fast search" by Sriniously, *Backend from first principles* playlist (YouTube, 32:08)
> **Link:** https://www.youtube.com/watch?v=7_sovzAhRSM
>
> I wrote these from the video's full caption track, summarised in my own words. The diagrams, queries and code sketches are my own illustrations.

---

## 1. The story: search that stopped scaling

**2005, a fast-growing e-commerce company:** ~5,000 products. I need a search API.

```sql
SELECT * FROM products
WHERE name ILIKE '%laptop%' OR description ILIKE '%laptop%';
```
- `%` = match any characters before or after. Results come back in ~50 ms. Life is easy.

**Then the company explodes to millions of products:**
- The same query now takes **~30 seconds**. Customers and managers are frustrated.
- New requirements on top:
  1. **Faster.**
  2. **Smarter / relevant:** for "laptop", show a **MacBook Pro** before a **laptop bag**.
  3. **Typo-tolerant:** rushed shoppers during a sale type "laptpo" and should still get laptop results.

That combination (speed + relevance + typo robustness) is **why search engines like Elasticsearch exist**.

---

## 2. The librarian analogy

**My relational DB is like a librarian** who knows where every book is, with **one fatal flaw**:

- Asked for "machine learning" books, they check **every book on every shelf, one by one**:
  - *Harry Potter…* ✗ → *Game of Thrones* ✗ → *Introduction to Machine Learning* ✓ → keep going…
  - Minutes to days for a library of 10 million or a billion books.
- **No sense of relevance:** a book titled *Introduction to Machine Learning* and a book that mentions "machine learning" once on its last page are returned in **any order**, and the irrelevant one might come first.

**That's exactly what `ILIKE '%term%'` does:** scans every row, examines every text field, pattern-matches character by character. Thorough, but **painfully slow**, and **no ranking**. The best result might sit at position 1,000 or 10,000.

### Why it mattered
Around the same time came the **information explosion**: Google crawling and indexing billions of pages, Amazon cataloguing millions of products, LinkedIn indexing millions of profiles. **30 seconds is unacceptable.** Even 2 seconds is a lot today. Search must be **milliseconds**, because slow search kills conversions and users.

The answer came from **decades of information-retrieval research** (since the **1960s**).

---

## 3. The big idea: inverted index

**Flip the problem.** Instead of scanning documents for terms, **when documents are added**, index every word: **word → which documents contain it, and where**.

```
FORWARD (how the librarian searches)       INVERTED INDEX (built at insert time)
book → words inside it                     word → books (+ positions)

"Intro to Machine Learning" → ...          machine  → Intro to ML (p.1, 15, 23)
"The Machine Age"           → ...                     The Machine Age (p.5, 89)
"Coffee Machine Manual"     → ...                     Coffee Machine Manual (p.1)
"Learning to Cook"          → ...          learning → Intro to ML (p.1, 16, 24)
"Deep Learning Fundamentals"→ ...                     Learning to Cook (2 places)
                                                      Deep Learning Fundamentals (3 places)
```
(In reality a book titled *Intro to ML* uses those words hundreds of times. The numbers are just for the example.)

- Query "machine learning" → look up `machine` and `learning` **directly** → done. No full scan.
- **Inverted** because I go **from terms to content**, not content to terms.

### The tech underneath
- **Apache Lucene:** the core inverted-index search library.
- **Elasticsearch** is built on Lucene, as are many other full-text search tools.
- Even **Postgres** now has built-in **full-text search**.

---

## 4. Relevance scoring (BM25)

Beyond speed, Elasticsearch **ranks** results by relevance:

```
"machine" query →
  1. Intro to Machine Learning   ← term in TITLE + appears often   (highest)
  2. The Machine Age             ← in title, appears less often
  3. Coffee Machine Manual       ← in title, appears rarely        (lowest)
```

It uses the **BM25** algorithm. Main factors:

| Factor | Question it asks |
|---|---|
| **Term frequency** | How often does the term appear **in this document**? |
| **Document frequency** | How common is the term **across all documents**? (rarer terms carry more weight) |
| **Document length** | Short or long document? |
| **Field boosting** | **Which field** matched? E.g. **title > description > content**. **I can set my own boosts** in the query |

- An Elasticsearch **document** is a **JSON document** (a bit like MongoDB). Each entity is one document.
- Queries use the **Elasticsearch DSL**, a JSON-based query language with lots of parameters.

```json
// field boosting (illustrative)
{
  "query": {
    "multi_match": {
      "query": "machine learning",
      "fields": ["title^3", "description^2", "content"]
    }
  }
}
```

**His advice:** there's a lot of theory behind BM25 and the index internals. Unless I'm **building** a search library, treat it as a **tool**: know when to use it, follow the **docs and best practices**, and move on. The Elasticsearch docs are great if I'm curious.

---

## 5. Typo tolerance and type-ahead

- **Type-ahead / autocomplete:** suggestions as I type (Google, Amazon). Elasticsearch-style tech can build this. (Google likely uses something proprietary, possibly Lucene-like.)
- **Typo tolerance demo:** he types "what is **treading** today" into Google, and it understands he meant "**trending**".
- Full-text search engines **infer the intended query** despite typos.

```json
// fuzzy matching (illustrative)
{ "query": { "match": { "name": { "query": "laptpo", "fuzziness": "AUTO" } } } }
```

---

## 6. Postgres FTS vs Elasticsearch

Building a search / type-ahead feature? Two main options:

| Option | When |
|---|---|
| **Postgres full-text search** | Already on Postgres, want to keep the stack simple |
| **Elasticsearch** | Especially if the company **already runs it**, e.g. as part of the **ELK stack** |

**ELK stack = Elasticsearch + Logstash + Kibana**, a very popular **log-management** stack (fast searching through logs, statistics, visualisation). If Elasticsearch is already there for logs, using it for search too makes sense.

---

## 7. Demo: Postgres ILIKE vs Elasticsearch on 50k reviews

### Setup
- A **Next.js** prototype (chosen only because LLMs generate quick Next.js prototypes well).
- For fairness: **Neon** (serverless Postgres) and **Elastic Cloud**, **both in US-West**, so distance isn't a factor.
- **Data:** a CSV of **50,000 reviews**, each with `review` and `sentiment` (positive/negative).

### Postgres side
```sql
CREATE TABLE IF NOT EXISTS reviews (
  id        SERIAL PRIMARY KEY,
  review    TEXT,
  sentiment TEXT        -- 'positive' | 'negative'
);
```
- The populate script (Node.js) reads the DB URL, ES address, and ES API key from env (errors if missing), creates both clients, reads the CSV, **resets IDs**, filters rows missing either field, and **inserts in batches of 1,000** (Neon limits one huge insert).

### Elasticsearch side
- If the `reviews` index exists, **delete it** (fresh start), then **create it with mappings**:

```json
{
  "mappings": {
    "properties": {
      "review":    { "type": "text" },     // analysed: broken into terms for full-text search
      "sentiment": { "type": "keyword" }   // exact match only
    }
  }
}
```
- `text` = full-text searchable (tokenised). `keyword` = exact-value matching.
- **Bulk insert** all 50,000 documents.
- Verified: 50,000 docs in Elastic Cloud, and `SELECT COUNT(*) FROM reviews` → 50,000 in Neon.

### The search API route
```
POST /api/search { term }
  → bad input → 400
  → open a STREAM to the frontend (so the faster result shows immediately)
  → run in parallel, timing each:
      Postgres:       SELECT id, review, sentiment FROM reviews WHERE review ILIKE '%' || term || '%'
      Elasticsearch:  query_string on index "reviews" with *lowercased term* wildcards (same breadth, fair test)
  → stream each result + elapsed time as soon as it's ready
```

### Results
| Search | Elasticsearch | Postgres `ILIKE` |
|---|---|---|
| "laptop" | ~**1 s** | ~**3–4 s** |
| a common word (~8,000 matches) | ~**500 ms** | ~**7.5 s** |

- **Same number of results** from both (criteria matched on purpose), but **Postgres `ILIKE` is far slower**.
- The demo only measured **speed**. Relevance and typo tolerance are extra wins on top.

---

## 8. How much I need to know

- **Search / type-ahead use case → use full-text search** (Postgres FTS or Elasticsearch). It's a tool I should have **in my arsenal**.
- **I don't need to master Elasticsearch.** Doc and LLM snippets cover most search use cases. Read deeper only to optimise.
- **Databases, on the other hand, I must master:** querying, optimising, indexes, every part. They're in roughly **99% of a backend codebase**.

---

## 9. My cheat sheet

```
PROBLEM   ILIKE '%term%' = full scan, char-by-char → slow at millions of rows (50 ms → 30 s)
          + no relevance ranking + no typo tolerance

LIBRARIAN DB checks every book one by one; returns matches in random order

INVERTED INDEX  (built at insert time)
  term → [documents + positions]   → query looks up terms directly (no scan)
  Apache Lucene powers it → Elasticsearch (and others); Postgres has FTS too

RELEVANCE (BM25)
  term frequency · document frequency · document length · FIELD BOOSTING (title^3 > desc^2 > content)
  documents = JSON · queries = Elasticsearch JSON DSL

EXTRAS    typo tolerance (fuzziness) · type-ahead/autocomplete

CHOOSE    Postgres FTS (simple stack) | Elasticsearch (esp. if ELK already in use)
ELK       Elasticsearch + Logstash + Kibana (log management)

MAPPINGS  text = analysed full-text · keyword = exact match

DEMO (50k reviews, same region)
  "laptop": ES ~1 s vs PG ~3–4 s · common word: ES ~0.5 s vs PG ~7.5 s

MINDSET   use ES as a tool (docs/snippets) · MASTER databases instead
```
