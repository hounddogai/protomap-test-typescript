import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightScheduleEngine } from "./insight-schedule-engine.js";
import { newInsightSchedule } from "./insight-schedule.js";

test("InsightScheduleEngine keeps results within bounds", () => {
  const engine = defaultInsightScheduleEngine(flags.newRegistry());
  const item = newInsightSchedule("code-312", "label-698");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
