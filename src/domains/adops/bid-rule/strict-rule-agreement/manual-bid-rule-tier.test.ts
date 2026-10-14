import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBidRuleTier } from "./manual-bid-rule-tier.js";

test("ManualBidRuleTier starts in new", () => {
  const item = newManualBidRuleTier("code-375", "name-527");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBidRuleTier moves to running", () => {
  const item = newManualBidRuleTier("code-375", "name-527");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ManualBidRuleTier rejects moves from failed", () => {
  const item = newManualBidRuleTier("code-375", "name-527");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
