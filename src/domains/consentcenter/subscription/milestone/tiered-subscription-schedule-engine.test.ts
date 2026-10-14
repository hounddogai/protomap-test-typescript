import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredSubscriptionScheduleEngine } from "./tiered-subscription-schedule-engine.js";
import { newTieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

test("TieredSubscriptionScheduleEngine keeps results within bounds", () => {
  const engine = defaultTieredSubscriptionScheduleEngine();
  const item = newTieredSubscriptionSchedule("code-993", "label-136");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
