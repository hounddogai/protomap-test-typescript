import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredEnrollmentSchedule } from "./tiered-enrollment-schedule.js";

test("TieredEnrollmentSchedule starts in planned", () => {
  const item = newTieredEnrollmentSchedule("code-451", "title-26");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredEnrollmentSchedule moves to scheduled", () => {
  const item = newTieredEnrollmentSchedule("code-451", "title-26");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredEnrollmentSchedule rejects moves from cancelled", () => {
  const item = newTieredEnrollmentSchedule("code-451", "title-26");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
