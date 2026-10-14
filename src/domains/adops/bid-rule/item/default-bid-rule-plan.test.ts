import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultBidRulePlan } from "./default-bid-rule-plan.js";

test("DefaultBidRulePlan starts in open", () => {
  const item = newDefaultBidRulePlan("code-841", "name-201");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultBidRulePlan moves to archived", () => {
  const item = newDefaultBidRulePlan("code-841", "name-201");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("DefaultBidRulePlan rejects moves from archived", () => {
  const item = newDefaultBidRulePlan("code-841", "name-201");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
