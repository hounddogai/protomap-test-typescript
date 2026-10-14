import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultEscalationScheduleEngine } from "./default-escalation-schedule-engine.js";
import { newDefaultEscalationSchedule } from "./default-escalation-schedule.js";

test("DefaultEscalationScheduleEngine keeps results within bounds", () => {
  const engine = defaultDefaultEscalationScheduleEngine();
  const item = newDefaultEscalationSchedule("code-542", "title-629");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
