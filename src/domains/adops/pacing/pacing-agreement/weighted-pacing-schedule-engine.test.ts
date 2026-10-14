import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedPacingScheduleEngine } from "./weighted-pacing-schedule-engine.js";
import { newWeightedPacingSchedule } from "./weighted-pacing-schedule.js";

test("WeightedPacingScheduleEngine keeps results within bounds", () => {
  const engine = defaultWeightedPacingScheduleEngine();
  const item = newWeightedPacingSchedule("code-708", "name-270");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
