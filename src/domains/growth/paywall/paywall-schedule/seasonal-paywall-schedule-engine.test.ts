import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalPaywallScheduleEngine } from "./seasonal-paywall-schedule-engine.js";
import { newSeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

test("SeasonalPaywallScheduleEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPaywallScheduleEngine();
  const item = newSeasonalPaywallSchedule("code-700", "label-497");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
