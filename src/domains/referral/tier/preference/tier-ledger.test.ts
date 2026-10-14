import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierLedger } from "./tier-ledger.js";

test("TierLedger starts in draft", () => {
  const item = newTierLedger("code-529", "title-891");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierLedger moves to suspended", () => {
  const item = newTierLedger("code-529", "title-891");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("TierLedger rejects moves from closed", () => {
  const item = newTierLedger("code-529", "title-891");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
