import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveEnrollmentScheduleEngine } from "./adaptive-enrollment-schedule-engine.js";
import { newAdaptiveEnrollmentSchedule } from "./adaptive-enrollment-schedule.js";

test("AdaptiveEnrollmentScheduleEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveEnrollmentScheduleEngine(flags.newRegistry());
  const item = newAdaptiveEnrollmentSchedule("code-274", "name-512");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
