import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPacingSchedule } from "./weighted-pacing-schedule.js";

test("WeightedPacingSchedule starts in new", () => {
  const item = newWeightedPacingSchedule("code-708", "name-270");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPacingSchedule moves to running", () => {
  const item = newWeightedPacingSchedule("code-708", "name-270");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedPacingSchedule rejects moves from failed", () => {
  const item = newWeightedPacingSchedule("code-708", "name-270");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
