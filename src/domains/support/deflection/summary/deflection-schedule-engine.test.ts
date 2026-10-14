import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionScheduleEngine } from "./deflection-schedule-engine.js";
import { newDeflectionSchedule } from "./deflection-schedule.js";

test("DeflectionScheduleEngine keeps results within bounds", () => {
  const engine = defaultDeflectionScheduleEngine(flags.newRegistry());
  const item = newDeflectionSchedule("code-376", "title-903");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
