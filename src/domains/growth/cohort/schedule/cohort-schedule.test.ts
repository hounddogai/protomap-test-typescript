import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortSchedule } from "./cohort-schedule.js";

test("CohortSchedule starts in open", () => {
  const item = newCohortSchedule("code-566", "label-805");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortSchedule moves to resolved", () => {
  const item = newCohortSchedule("code-566", "label-805");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CohortSchedule rejects moves from archived", () => {
  const item = newCohortSchedule("code-566", "label-805");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
