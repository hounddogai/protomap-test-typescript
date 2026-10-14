import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveEnrollmentSchedule } from "./adaptive-enrollment-schedule.js";

test("AdaptiveEnrollmentSchedule starts in created", () => {
  const item = newAdaptiveEnrollmentSchedule("code-274", "name-512");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveEnrollmentSchedule moves to published", () => {
  const item = newAdaptiveEnrollmentSchedule("code-274", "name-512");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("AdaptiveEnrollmentSchedule rejects moves from retired", () => {
  const item = newAdaptiveEnrollmentSchedule("code-274", "name-512");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
