import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBranchPlan } from "./fallback-branch-plan.js";

test("FallbackBranchPlan starts in created", () => {
  const item = newFallbackBranchPlan("code-140", "name-598");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBranchPlan moves to validated", () => {
  const item = newFallbackBranchPlan("code-140", "name-598");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackBranchPlan rejects moves from retired", () => {
  const item = newFallbackBranchPlan("code-140", "name-598");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
