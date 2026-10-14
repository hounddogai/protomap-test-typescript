import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimarySlaScheduleEngine } from "./primary-sla-schedule-engine.js";
import { newPrimarySlaSchedule } from "./primary-sla-schedule.js";

test("PrimarySlaScheduleEngine keeps results within bounds", () => {
  const engine = defaultPrimarySlaScheduleEngine();
  const item = newPrimarySlaSchedule("code-931", "name-981");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
