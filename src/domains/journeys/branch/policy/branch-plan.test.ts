import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchPlan } from "./branch-plan.js";

test("BranchPlan starts in open", () => {
  const item = newBranchPlan("code-360", "label-709");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchPlan moves to in review", () => {
  const item = newBranchPlan("code-360", "label-709");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BranchPlan rejects moves from archived", () => {
  const item = newBranchPlan("code-360", "label-709");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
