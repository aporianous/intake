# ai-workflow-demo

**Pulls clean records and action items out of messy documents — validated,
with a human-review flag.**

Reads emails, invoices, meeting notes and web-form inquiries, extracts a
strict JSON record from each, validates it, and flags the uncertain ones
for a human instead of guessing.

## Why it exists
Small teams drown in messy input that must become records and actions.
The failure mode of naive automation is **silent bad data**: the AI
invents a field, or drops one, and nobody notices. This pipeline is built
to fail *loudly instead*: every record is validated, and anything low
confidence or missing an owner/due is flagged for a human.

## Run it
```
set GROQ_API_KEY=<your key>     # free at console.groq.com
node run.js
```
Optional overrides: `LLM_MODEL`, `LLM_API_URL` (any OpenAI-compatible endpoint).

## What it does, step by step
1. Reads every file in `samples/`.
2. Sends each to an LLM with a **strict JSON schema** (temperature 0).
3. **Validates** the result (required keys, types) — malformed output is retried, then flagged, never silently accepted.
4. Writes:
   - `out/records.jsonl` — one structured record per input
   - `out/tasks.csv` — action items (task, owner, due, priority, review)
5. Counts how many inputs were **flagged for human review**.

## What to change for a real client
- Swap `samples/` for their real inputs.
- Edit the JSON shape in `run.js` to their fields.
- Point `LLM_API_URL` at their provider.
- Route `out/tasks.csv` into their tool (Sheets, Airtable, a task app).

## Design notes (the parts that make it dependable)
- **Temperature 0** + JSON mode → repeatable.
- **Retry on malformed JSON**, then flag — no fabricated records.
- **Validation + human-review flag** → the workflow can be trusted by a team.
- **Zero dependencies** (Node built-ins only) → trivial to run and maintain.
