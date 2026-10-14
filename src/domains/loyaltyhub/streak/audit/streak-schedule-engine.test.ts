import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStreakScheduleEngine } from "./streak-schedule-engine.js";
import { newStreakSchedule } from "./streak-schedule.js";

test("StreakScheduleEngine keeps results within bounds", () => {
  const engine = defaultStreakScheduleEngine();
  const item = newStreakSchedule("code-696", "label-292");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
