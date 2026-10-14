import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingDeflectionScheduleEngine } from "./rolling-deflection-schedule-engine.js";
import { newRollingDeflectionSchedule } from "./rolling-deflection-schedule.js";

test("RollingDeflectionScheduleEngine keeps results within bounds", () => {
  const engine = defaultRollingDeflectionScheduleEngine();
  const item = newRollingDeflectionSchedule("code-770", "label-781");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
