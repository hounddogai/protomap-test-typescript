import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelScheduleEngine } from "./funnel-schedule-engine.js";
import { newFunnelSchedule } from "./funnel-schedule.js";

test("FunnelScheduleEngine keeps results within bounds", () => {
  const engine = defaultFunnelScheduleEngine();
  const item = newFunnelSchedule("code-519", "title-846");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
