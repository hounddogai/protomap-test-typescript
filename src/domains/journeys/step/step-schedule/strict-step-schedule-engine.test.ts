import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictStepScheduleEngine } from "./strict-step-schedule-engine.js";
import { newStrictStepSchedule } from "./strict-step-schedule.js";

test("StrictStepScheduleEngine keeps results within bounds", () => {
  const engine = defaultStrictStepScheduleEngine();
  const item = newStrictStepSchedule("code-41", "label-194");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
