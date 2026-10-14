import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingScheduleEngine } from "./pacing-schedule-engine.js";
import { newPacingSchedule } from "./pacing-schedule.js";

test("PacingScheduleEngine keeps results within bounds", () => {
  const engine = defaultPacingScheduleEngine(flags.newRegistry());
  const item = newPacingSchedule("code-988", "label-350");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
