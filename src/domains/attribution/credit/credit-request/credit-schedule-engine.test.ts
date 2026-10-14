import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditScheduleEngine } from "./credit-schedule-engine.js";
import { newCreditSchedule } from "./credit-schedule.js";

test("CreditScheduleEngine keeps results within bounds", () => {
  const engine = defaultCreditScheduleEngine();
  const item = newCreditSchedule("code-79", "title-973");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
