import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCohortSchedule } from "./lenient-cohort-schedule.js";

test("LenientCohortSchedule starts in idle", () => {
  const item = newLenientCohortSchedule("code-776", "label-293");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCohortSchedule moves to warming", () => {
  const item = newLenientCohortSchedule("code-776", "label-293");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientCohortSchedule rejects moves from stopped", () => {
  const item = newLenientCohortSchedule("code-776", "label-293");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
