import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyEscalationScheduleEngine } from "./legacy-escalation-schedule-engine.js";
import { newLegacyEscalationSchedule } from "./legacy-escalation-schedule.js";

test("LegacyEscalationScheduleEngine keeps results within bounds", () => {
  const engine = defaultLegacyEscalationScheduleEngine(flags.newRegistry());
  const item = newLegacyEscalationSchedule("code-223", "name-425");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
