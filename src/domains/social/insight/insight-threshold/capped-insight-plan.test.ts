import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedInsightPlan } from "./capped-insight-plan.js";

test("CappedInsightPlan starts in new", () => {
  const item = newCappedInsightPlan("code-720", "name-239");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedInsightPlan moves to running", () => {
  const item = newCappedInsightPlan("code-720", "name-239");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("CappedInsightPlan rejects moves from failed", () => {
  const item = newCappedInsightPlan("code-720", "name-239");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
