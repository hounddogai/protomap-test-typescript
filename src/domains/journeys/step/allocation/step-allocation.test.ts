import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepAllocation } from "./step-allocation.js";

test("StepAllocation starts in new", () => {
  const item = newStepAllocation("code-727", "label-318");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepAllocation moves to queued", () => {
  const item = newStepAllocation("code-727", "label-318");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StepAllocation rejects moves from failed", () => {
  const item = newStepAllocation("code-727", "label-318");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
