import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRulePlan } from "./bid-rule-plan.js";

test("BidRulePlan starts in planned", () => {
  const item = newBidRulePlan("code-723", "name-679");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRulePlan moves to in progress", () => {
  const item = newBidRulePlan("code-723", "name-679");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BidRulePlan rejects moves from cancelled", () => {
  const item = newBidRulePlan("code-723", "name-679");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
