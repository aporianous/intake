'use strict';
// ai-workflow-demo — messy text -> AI extraction -> structured records -> actions.
// Zero dependencies. Runs on an OpenAI-compatible endpoint (default: Groq, free tier).
//
//   set GROQ_API_KEY, then:  node run.js
//
// Outputs: out/records.jsonl (structured records) and out/tasks.csv (action items).

const fs = require('fs');
const path = require('path');

const API_URL = process.env.LLM_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = process.env.GROQ_API_KEY || process.env.LLM_API_KEY || '';
const MODEL = process.env.LLM_MODEL || 'openai/gpt-oss-20b';

const ROOT = __dirname;
const SAMPLES = path.join(ROOT, 'samples');
const OUT = path.join(ROOT, 'out');

if (!API_KEY) { console.error('ERROR: no key. set GROQ_API_KEY (free at console.groq.com).'); process.exit(1); }

const SYSTEM =
  'You convert messy business text into ONE structured JSON record. ' +
  'Return ONLY JSON, matching exactly:\n' +
  '{\n' +
  '  "doc_type": "invoice" | "email" | "meeting_note" | "other",\n' +
  '  "summary": "one sentence",\n' +
  '  "entities": { "people": [], "companies": [], "amounts": [], "dates": [] },\n' +
  '  "action_items": [ { "task": "", "owner": null, "due": null, "priority": "high" | "medium" | "low" } ],\n' +
  '  "confidence": 0.0,\n' +
  '  "needs_review": false\n' +
  '}\n' +
  'Rules: use ONLY facts present in the text. Unknown value -> null. No items -> empty array. ' +
  'Set needs_review=true when confidence < 0.7 OR any action item is missing both owner and due.';

async function callLLM(text, filename) {
  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: 'Filename: ' + filename + '\n-----\n' + text },
  ];
  let lastErr = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages,
      }),
    });
    if (!res.ok) {
      lastErr = 'HTTP ' + res.status + ': ' + (await res.text()).slice(0, 300);
      continue;
    }
    const data = await res.json();
    const msg = (data.choices && data.choices[0] && data.choices[0].message) || {};
    const raw = msg.content || msg.reasoning || '';
    const parsed = extractJson(raw);
    if (parsed) return parsed;
    lastErr = 'bad JSON: ' + String(raw).slice(0, 200);
  }
  throw new Error(lastErr);
}

// Reasoning models sometimes wrap the answer; pull the first JSON object out.
function extractJson(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch (e) { /* continue */ }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(s.slice(start, end + 1)); } catch (e) { return null; }
}

const REQUIRED = ['doc_type', 'summary', 'entities', 'action_items', 'confidence', 'needs_review'];

function validate(rec) {
  const errs = [];
  if (!rec || typeof rec !== 'object') return ['not an object'];
  for (const k of REQUIRED) if (!(k in rec)) errs.push('missing ' + k);
  if (rec.entities && typeof rec.entities !== 'object') errs.push('entities not an object');
  if (!Array.isArray(rec.action_items)) errs.push('action_items not an array');
  if (typeof rec.confidence !== 'number') errs.push('confidence not a number');
  return errs;
}

function csv(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

(async () => {
  const files = fs.readdirSync(SAMPLES).filter((f) => /\.(txt|md|eml)$/i.test(f)).sort();
  const records = [];
  const tasks = [];
  let flagged = 0;

  console.log('Extracting ' + files.length + ' messy input file(s)...\n');

  for (const f of files) {
    const text = fs.readFileSync(path.join(SAMPLES, f), 'utf8');
    let rec;
    let problems = [];
    try {
      rec = await callLLM(text, f);
      problems = validate(rec);
    } catch (e) {
      rec = {};
      problems = ['extraction failed: ' + e.message];
    }
    if (problems.length) {
      rec = Object.assign({ doc_type: rec.doc_type || 'error', summary: rec.summary || 'EXTRACTION FAILED', action_items: rec.action_items || [] }, rec, {
        needs_review: true,
        errors: problems,
      });
    }
    if (rec.needs_review) flagged++;
    records.push(Object.assign({ source: f }, rec));
    for (const a of rec.action_items || []) {
      tasks.push({
        source: f, task: a.task, owner: a.owner == null ? '' : a.owner,
        due: a.due == null ? '' : a.due, priority: a.priority || 'medium',
        review: rec.needs_review ? 'yes' : 'no',
      });
    }
    const tag = problems.length ? 'ERROR' : rec.needs_review ? 'REVIEW' : 'OK';
    console.log('  [' + tag + '] ' + f + ' -> ' + (rec.doc_type || '?') + ' | ' + (rec.summary || ''));
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'records.jsonl'), records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const header = 'source,task,owner,due,priority,review';
  const rows = tasks.map((t) => [t.source, t.task, t.owner, t.due, t.priority, t.review].map(csv).join(','));
  fs.writeFileSync(path.join(OUT, 'tasks.csv'), header + '\n' + rows.join('\n') + '\n');

  console.log('\nDone.');
  console.log('  out/records.jsonl  ' + records.length + ' structured records');
  console.log('  out/tasks.csv      ' + tasks.length + ' action items');
  console.log('  ' + flagged + ' of ' + files.length + ' flagged for human review');
})().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
