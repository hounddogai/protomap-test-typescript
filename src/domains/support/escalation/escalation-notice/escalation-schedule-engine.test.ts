import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEscalationScheduleEngine } from "./escalation-schedule-engine.js";
import { newEscalationSchedule } from "./escalation-schedule.js";

test("EscalationScheduleEngine keeps results within bounds", () => {
  const engine = defaultEscalationScheduleEngine(flags.newRegistry());
  const item = newEscalationSchedule("code-441", "label-105");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
