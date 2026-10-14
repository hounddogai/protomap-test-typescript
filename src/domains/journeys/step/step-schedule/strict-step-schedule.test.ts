import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictStepSchedule } from "./strict-step-schedule.js";

test("StrictStepSchedule starts in open", () => {
  const item = newStrictStepSchedule("code-41", "label-194");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictStepSchedule moves to in review", () => {
  const item = newStrictStepSchedule("code-41", "label-194");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StrictStepSchedule rejects moves from archived", () => {
  const item = newStrictStepSchedule("code-41", "label-194");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
