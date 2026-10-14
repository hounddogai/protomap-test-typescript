import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepCheckpoint } from "./step-checkpoint.js";

test("StepCheckpoint starts in created", () => {
  const item = newStepCheckpoint("code-501", "label-24");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepCheckpoint moves to published", () => {
  const item = newStepCheckpoint("code-501", "label-24");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("StepCheckpoint rejects moves from retired", () => {
  const item = newStepCheckpoint("code-501", "label-24");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
