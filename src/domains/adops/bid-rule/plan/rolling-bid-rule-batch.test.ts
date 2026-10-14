import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingBidRuleBatch } from "./rolling-bid-rule-batch.js";

test("RollingBidRuleBatch starts in proposed", () => {
  const item = newRollingBidRuleBatch("code-125", "title-174");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingBidRuleBatch moves to rejected", () => {
  const item = newRollingBidRuleBatch("code-125", "title-174");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingBidRuleBatch rejects moves from withdrawn", () => {
  const item = newRollingBidRuleBatch("code-125", "title-174");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
