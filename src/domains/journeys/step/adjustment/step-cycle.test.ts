import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepCycle } from "./step-cycle.js";

test("StepCycle starts in planned", () => {
  const item = newStepCycle("code-149", "name-391");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepCycle moves to scheduled", () => {
  const item = newStepCycle("code-149", "name-391");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StepCycle rejects moves from cancelled", () => {
  const item = newStepCycle("code-149", "name-391");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
