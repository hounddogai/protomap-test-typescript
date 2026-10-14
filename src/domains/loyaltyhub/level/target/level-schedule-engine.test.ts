import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelScheduleEngine } from "./level-schedule-engine.js";
import { newLevelSchedule } from "./level-schedule.js";

test("LevelScheduleEngine keeps results within bounds", () => {
  const engine = defaultLevelScheduleEngine(flags.newRegistry());
  const item = newLevelSchedule("code-957", "name-630");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
