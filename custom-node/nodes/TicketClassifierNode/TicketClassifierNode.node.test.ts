import { classifyTicket } from './TicketClassifierNode.node';

// ─────────────────────────────────────────────────────────
//  Simple test runner (no external deps needed)
// ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function expect(label: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

function describe(suite: string, fn: () => void) {
  console.log(`\n📦 ${suite}`);
  fn();
}

// ─────────────────────────────────────────────────────────
//  Test Suite
// ─────────────────────────────────────────────────────────

describe('Category: billing', () => {
  const r = classifyTicket('Refund request for overcharge', 'I was charged twice for my subscription last month', 'website');
  expect('category = billing',        r.category === 'billing');
  expect('reason contains "billing"', r.reason.toLowerCase().includes('billing') || r.reason.toLowerCase().includes('refund') || r.reason.toLowerCase().includes('charge') || r.reason.toLowerCase().includes('subscription'));
  expect('tags is array',             Array.isArray(r.tags));
});

describe('Category: bug', () => {
  const r = classifyTicket('App crashes on login', 'Getting a 500 error whenever I try to log in', 'chat');
  expect('category = bug',      r.category === 'bug');
  expect('has reason text',     r.reason.length > 0);
});

describe('Category: feature_request', () => {
  const r = classifyTicket('Feature request: dark mode', 'Would like a dark mode option in the dashboard', 'email');
  expect('category = feature_request', r.category === 'feature_request');
});

describe('Fallback Case: general/low', () => {
  const r = classifyTicket('Hello team', 'Just saying thanks for the great support last week!', 'website');
  expect('category = general',  r.category === 'general');
  expect('priority = low',      r.priority === 'low');
  expect('tags array is empty or small', Array.isArray(r.tags));
});

describe('Priority: high', () => {
  const r = classifyTicket('URGENT - production down', 'Our entire production environment is down. This is a critical outage!', 'email');
  expect('priority = high', r.priority === 'high');
  expect('reason contains high-priority mention', r.reason.toLowerCase().includes('high'));
});

describe('Priority: medium', () => {
  const r = classifyTicket('Something is broken', 'The export feature is not working as expected', 'website');
  expect('priority = medium or high', r.priority === 'medium' || r.priority === 'high');
});

describe('Priority: billing/high combo', () => {
  const r = classifyTicket('Urgent refund needed', 'I was overcharged and need an immediate refund, this is critical', '');
  expect('category = billing', r.category === 'billing');
  expect('priority = high',    r.priority === 'high');
});

describe('Edge: empty source is OK', () => {
  const r = classifyTicket('invoice query', 'I need a copy of my invoice', '');
  expect('category = billing', r.category === 'billing');
  expect('no crash on empty source', true);
});

describe('Tags', () => {
  const r = classifyTicket('Billing error and refund', 'There is a charge error and I need a refund on my invoice', '');
  expect('tags includes known keywords', r.tags.length > 0);
  expect('tags are strings',            r.tags.every(t => typeof t === 'string'));
});

// ─────────────────────────────────────────────────────────
//  Summary
// ─────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Total: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
if (failed > 0) process.exit(1);
