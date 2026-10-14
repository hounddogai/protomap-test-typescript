import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainScheduleEngine } from "./domain-schedule-engine.js";
import { newDomainSchedule } from "./domain-schedule.js";

test("DomainScheduleEngine keeps results within bounds", () => {
  const engine = defaultDomainScheduleEngine();
  const item = newDomainSchedule("code-854", "label-682");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
