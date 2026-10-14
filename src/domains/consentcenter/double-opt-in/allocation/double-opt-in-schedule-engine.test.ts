import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDoubleOptInScheduleEngine } from "./double-opt-in-schedule-engine.js";
import { newDoubleOptInSchedule } from "./double-opt-in-schedule.js";

test("DoubleOptInScheduleEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInScheduleEngine();
  const item = newDoubleOptInSchedule("code-53", "label-557");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
