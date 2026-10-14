import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBidRuleVariance } from "./strict-bid-rule-variance.js";

test("StrictBidRuleVariance starts in idle", () => {
  const item = newStrictBidRuleVariance("code-310", "label-93");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBidRuleVariance moves to warming", () => {
  const item = newStrictBidRuleVariance("code-310", "label-93");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StrictBidRuleVariance rejects moves from stopped", () => {
  const item = newStrictBidRuleVariance("code-310", "label-93");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
