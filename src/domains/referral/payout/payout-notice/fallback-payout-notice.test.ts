import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPayoutNotice } from "./fallback-payout-notice.js";

test("FallbackPayoutNotice starts in new", () => {
  const item = newFallbackPayoutNotice("code-712", "name-565");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPayoutNotice moves to done", () => {
  const item = newFallbackPayoutNotice("code-712", "name-565");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("FallbackPayoutNotice rejects moves from failed", () => {
  const item = newFallbackPayoutNotice("code-712", "name-565");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
