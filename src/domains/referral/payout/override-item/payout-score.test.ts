import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutScore } from "./payout-score.js";

test("PayoutScore starts in new", () => {
  const item = newPayoutScore("code-114", "title-107");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutScore moves to done", () => {
  const item = newPayoutScore("code-114", "title-107");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PayoutScore rejects moves from failed", () => {
  const item = newPayoutScore("code-114", "title-107");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
