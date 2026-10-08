# intake

**Turn a folder of messy documents into a clean records export and a task
list. Validated, with a human-review flag.**

Drop in emails, invoices, meeting notes, web-form inquiries — anything
unstructured — and `intake` produces:

- `out/records.jsonl` — one structured record per document
- `out/tasks.csv` — the action items, with owner / due / priority
- an optional **webhook post** (Discord or Slack) summarising what came in

The point isn't just extraction — it's extraction you can *trust*. Every
record is schema-checked, and anything low-confidence or missing an owner
is flagged for a human instead of being silently accepted.

## Why
Naive AI automation fails *silently*: it invents a field or drops one and
nobody notices until it matters. `intake` fails **loudly instead** —
validate, and flag what's uncertain.

## Run
```
set GROQ_API_KEY=<your key>          # any OpenAI-compatible endpoint works
node run.js

# optional: post the summary somewhere
set WEBHOOK_URL=https://discord.com/api/webhooks/...   # or a Slack hook
node run.js
```
Overrides: `LLM_MODEL`, `LLM_API_URL`.

## How it works
1. Reads every file in `samples/`.
2. Extracts a strict JSON record from each at temperature 0.
3. **Validates** it (required keys, types); malformed output is retried,
   then flagged — never silently accepted.
4. Writes the records + task list.
5. Optionally posts a summary to a webhook.

## Using it on your own data
Point it at a folder, adjust the JSON shape in `run.js` to your fields,
and route `out/tasks.csv` into your tool (Sheets, Airtable, a task app) —
or let the webhook drop the summary into your team's channel.

## Design notes
- **Temperature 0 + JSON mode** → repeatable.
- **Retry, then flag** → no fabricated records.
- **Validation + human-review flag** → a team can rely on it.
- **Zero dependencies** (Node built-ins only) → runs anywhere, easy to keep.
