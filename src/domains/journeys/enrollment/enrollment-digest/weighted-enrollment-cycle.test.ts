import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

test("WeightedEnrollmentCycle starts in planned", () => {
  const item = newWeightedEnrollmentCycle("code-576", "label-767");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedEnrollmentCycle moves to in progress", () => {
  const item = newWeightedEnrollmentCycle("code-576", "label-767");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("WeightedEnrollmentCycle rejects moves from cancelled", () => {
  const item = newWeightedEnrollmentCycle("code-576", "label-767");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
