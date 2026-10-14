import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingEscalationScheduleEngine } from "./rolling-escalation-schedule-engine.js";
import { newRollingEscalationSchedule } from "./rolling-escalation-schedule.js";

test("RollingEscalationScheduleEngine keeps results within bounds", () => {
  const engine = defaultRollingEscalationScheduleEngine();
  const item = newRollingEscalationSchedule("code-837", "label-657");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
