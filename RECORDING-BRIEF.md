# Recording brief — "intake" (60–90 sec video)

Goal: one short video that proves the pipeline runs and measures quality.
No editing needed — a single unbroken screen recording.

## Prep (once)
- [ ] `GROQ_API_KEY` is set in the environment.
- [ ] Confirm a clean run: `node run.js` finishes in a few seconds.
- [ ] Terminal window is large, dark background, readable font.
- [ ] `out\tasks.csv` open in a second window (or ready to open).

## Shot list (record straight through)

1. **Show the problem (5 s).** Open `samples\` and briefly show the four
   messy files (email, invoice, meeting note, form).

2. **Run it (5 s).** In the terminal:
   ```
   node run.js
   ```

3. **Show the result (20 s).** Let the output land. Point at:
   - `[OK]` rows (resolved cleanly),
   - `[REVIEW]` rows (flagged),
   - `2 of 4 flagged for human review`.

4. **Prove the output is real (15 s).** Open `out\tasks.csv` and scroll.
   Point at the `review=yes` rows (`email Northgate renewal`,
   `follow up with rooftop quote`, `drop Denver pilot`) — action items
   with no owner, correctly flagged instead of silently accepted.

5. **State the point (15 s).** "Messy text in → structured records and
   action items out, validated, with anything uncertain flagged for a
   human. It runs on a free API, zero dependencies."

## Narration script (say this, roughly)

> "Teams drown in messy input — emails, invoices, notes — that has to
> become records and actions. Most automation fails silently: the AI
> invents or drops a field and nobody notices.
>
> This pipeline does the opposite. It reads each file, extracts a strict
> JSON record at temperature zero, then validates it. If anything is
> uncertain — low confidence, or an action item with no owner — it flags
> it for a human instead of guessing.
>
> Four messy files in: four structured records, seven action items, and
> two correctly flagged for review — with no false data produced."

## Handing to a cloud agent (e.g. Grok)

Give it: this brief, the folder `C:\Perseus\dev\ai-workflow-demo\`, and
its `GROQ_API_KEY`. Ask it to: run `node run.js`, screen-record the
terminal (plus `out\tasks.csv`), and narrate from the script above.
The only artifacts it needs are `run.js`, `samples\`, and `out\`.

## Fallback (no recording)
Open `demo-replay.html` in a browser — it replays the real output as an
animated terminal. Screen-record that, or send the file; it proves the
output without a live run.
