import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepSchedule } from "./step-schedule.js";

test("StepSchedule starts in planned", () => {
  const item = newStepSchedule("code-717", "name-115");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepSchedule moves to in progress", () => {
  const item = newStepSchedule("code-717", "name-115");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("StepSchedule rejects moves from cancelled", () => {
  const item = newStepSchedule("code-717", "name-115");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
