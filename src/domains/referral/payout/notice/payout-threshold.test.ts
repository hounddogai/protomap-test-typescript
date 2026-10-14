import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutThreshold } from "./payout-threshold.js";

test("PayoutThreshold starts in open", () => {
  const item = newPayoutThreshold("code-262", "title-309");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutThreshold moves to resolved", () => {
  const item = newPayoutThreshold("code-262", "title-309");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PayoutThreshold rejects moves from archived", () => {
  const item = newPayoutThreshold("code-262", "title-309");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
