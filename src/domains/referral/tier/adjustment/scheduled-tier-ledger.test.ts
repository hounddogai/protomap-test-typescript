import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledTierLedger } from "./scheduled-tier-ledger.js";

test("ScheduledTierLedger starts in draft", () => {
  const item = newScheduledTierLedger("code-749", "name-250");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledTierLedger moves to suspended", () => {
  const item = newScheduledTierLedger("code-749", "name-250");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ScheduledTierLedger rejects moves from closed", () => {
  const item = newScheduledTierLedger("code-749", "name-250");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
