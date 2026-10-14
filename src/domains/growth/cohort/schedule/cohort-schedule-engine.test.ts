import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortScheduleEngine } from "./cohort-schedule-engine.js";
import { newCohortSchedule } from "./cohort-schedule.js";

test("CohortScheduleEngine keeps results within bounds", () => {
  const engine = defaultCohortScheduleEngine();
  const item = newCohortSchedule("code-566", "label-805");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
