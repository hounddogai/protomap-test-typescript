import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepClaim } from "./step-claim.js";

test("StepClaim starts in created", () => {
  const item = newStepClaim("code-623", "label-53");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepClaim moves to published", () => {
  const item = newStepClaim("code-623", "label-53");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("StepClaim rejects moves from retired", () => {
  const item = newStepClaim("code-623", "label-53");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
