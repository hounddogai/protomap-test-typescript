import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingPreferenceScheduleEngine } from "./rolling-preference-schedule-engine.js";
import { newRollingPreferenceSchedule } from "./rolling-preference-schedule.js";

test("RollingPreferenceScheduleEngine keeps results within bounds", () => {
  const engine = defaultRollingPreferenceScheduleEngine(flags.newRegistry());
  const item = newRollingPreferenceSchedule("code-502", "name-818");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
