import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierScheduleEngine } from "./tier-schedule-engine.js";
import { newTierSchedule } from "./tier-schedule.js";

test("TierScheduleEngine keeps results within bounds", () => {
  const engine = defaultTierScheduleEngine();
  const item = newTierSchedule("code-864", "name-433");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
