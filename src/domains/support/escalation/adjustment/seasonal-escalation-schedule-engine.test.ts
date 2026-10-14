import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalEscalationScheduleEngine } from "./seasonal-escalation-schedule-engine.js";
import { newSeasonalEscalationSchedule } from "./seasonal-escalation-schedule.js";

test("SeasonalEscalationScheduleEngine keeps results within bounds", () => {
  const engine = defaultSeasonalEscalationScheduleEngine(flags.newRegistry());
  const item = newSeasonalEscalationSchedule("code-815", "name-358");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
