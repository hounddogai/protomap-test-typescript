import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointScheduleEngine } from "./touchpoint-schedule-engine.js";
import { newTouchpointSchedule } from "./touchpoint-schedule.js";

test("TouchpointScheduleEngine keeps results within bounds", () => {
  const engine = defaultTouchpointScheduleEngine();
  const item = newTouchpointSchedule("code-678", "name-452");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
