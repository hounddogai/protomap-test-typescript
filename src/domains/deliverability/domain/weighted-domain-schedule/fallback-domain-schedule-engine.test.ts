import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackDomainScheduleEngine } from "./fallback-domain-schedule-engine.js";
import { newFallbackDomainSchedule } from "./fallback-domain-schedule.js";

test("FallbackDomainScheduleEngine keeps results within bounds", () => {
  const engine = defaultFallbackDomainScheduleEngine();
  const item = newFallbackDomainSchedule("code-922", "label-959");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
