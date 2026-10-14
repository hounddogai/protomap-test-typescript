import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualEscalationScheduleEngine } from "./manual-escalation-schedule-engine.js";
import { newManualEscalationSchedule } from "./manual-escalation-schedule.js";

test("ManualEscalationScheduleEngine keeps results within bounds", () => {
  const engine = defaultManualEscalationScheduleEngine();
  const item = newManualEscalationSchedule("code-940", "title-481");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
