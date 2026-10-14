import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepSummary } from "./step-summary.js";

test("StepSummary starts in draft", () => {
  const item = newStepSummary("code-418", "name-196");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepSummary moves to pending", () => {
  const item = newStepSummary("code-418", "name-196");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StepSummary rejects moves from closed", () => {
  const item = newStepSummary("code-418", "name-196");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
