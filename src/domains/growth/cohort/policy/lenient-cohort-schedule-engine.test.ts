import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientCohortScheduleEngine } from "./lenient-cohort-schedule-engine.js";
import { newLenientCohortSchedule } from "./lenient-cohort-schedule.js";

test("LenientCohortScheduleEngine keeps results within bounds", () => {
  const engine = defaultLenientCohortScheduleEngine(flags.newRegistry());
  const item = newLenientCohortSchedule("code-776", "label-293");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
