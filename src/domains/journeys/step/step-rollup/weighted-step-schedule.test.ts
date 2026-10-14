import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedStepSchedule } from "./weighted-step-schedule.js";

test("WeightedStepSchedule starts in requested", () => {
  const item = newWeightedStepSchedule("code-710", "title-407");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedStepSchedule moves to granted", () => {
  const item = newWeightedStepSchedule("code-710", "title-407");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WeightedStepSchedule rejects moves from expired", () => {
  const item = newWeightedStepSchedule("code-710", "title-407");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
