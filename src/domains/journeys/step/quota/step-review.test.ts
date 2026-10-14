import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepReview } from "./step-review.js";

test("StepReview starts in new", () => {
  const item = newStepReview("code-930", "label-873");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepReview moves to done", () => {
  const item = newStepReview("code-930", "label-873");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("StepReview rejects moves from failed", () => {
  const item = newStepReview("code-930", "label-873");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
