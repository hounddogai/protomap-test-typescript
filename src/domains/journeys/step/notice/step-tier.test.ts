import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepTier } from "./step-tier.js";

test("StepTier starts in open", () => {
  const item = newStepTier("code-626", "title-909");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepTier moves to in review", () => {
  const item = newStepTier("code-626", "title-909");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StepTier rejects moves from archived", () => {
  const item = newStepTier("code-626", "title-909");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
