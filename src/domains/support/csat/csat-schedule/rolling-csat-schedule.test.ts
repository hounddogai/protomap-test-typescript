import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCsatSchedule } from "./rolling-csat-schedule.js";

test("RollingCsatSchedule starts in planned", () => {
  const item = newRollingCsatSchedule("code-849", "name-900");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCsatSchedule moves to scheduled", () => {
  const item = newRollingCsatSchedule("code-849", "name-900");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RollingCsatSchedule rejects moves from cancelled", () => {
  const item = newRollingCsatSchedule("code-849", "name-900");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
