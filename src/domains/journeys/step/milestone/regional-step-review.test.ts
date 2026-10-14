import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalStepReview } from "./regional-step-review.js";

test("RegionalStepReview starts in open", () => {
  const item = newRegionalStepReview("code-42", "name-352");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalStepReview moves to resolved", () => {
  const item = newRegionalStepReview("code-42", "name-352");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RegionalStepReview rejects moves from archived", () => {
  const item = newRegionalStepReview("code-42", "name-352");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
