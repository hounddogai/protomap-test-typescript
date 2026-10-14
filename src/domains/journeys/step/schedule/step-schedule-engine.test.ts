import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStepScheduleEngine } from "./step-schedule-engine.js";
import { newStepSchedule } from "./step-schedule.js";

test("StepScheduleEngine keeps results within bounds", () => {
  const engine = defaultStepScheduleEngine();
  const item = newStepSchedule("code-717", "name-115");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
