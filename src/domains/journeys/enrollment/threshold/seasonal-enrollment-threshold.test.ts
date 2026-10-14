import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalEnrollmentThreshold } from "./seasonal-enrollment-threshold.js";

test("SeasonalEnrollmentThreshold starts in planned", () => {
  const item = newSeasonalEnrollmentThreshold("code-230", "label-900");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalEnrollmentThreshold moves to scheduled", () => {
  const item = newSeasonalEnrollmentThreshold("code-230", "label-900");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SeasonalEnrollmentThreshold rejects moves from cancelled", () => {
  const item = newSeasonalEnrollmentThreshold("code-230", "label-900");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
