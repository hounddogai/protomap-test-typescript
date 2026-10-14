import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledEnrollmentForecast } from "./scheduled-enrollment-forecast.js";

test("ScheduledEnrollmentForecast starts in planned", () => {
  const item = newScheduledEnrollmentForecast("code-782", "label-321");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledEnrollmentForecast moves to scheduled", () => {
  const item = newScheduledEnrollmentForecast("code-782", "label-321");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ScheduledEnrollmentForecast rejects moves from cancelled", () => {
  const item = newScheduledEnrollmentForecast("code-782", "label-321");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
