import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionScheduleEngine } from "./subscription-schedule-engine.js";
import { newSubscriptionSchedule } from "./subscription-schedule.js";

test("SubscriptionScheduleEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionScheduleEngine();
  const item = newSubscriptionSchedule("code-128", "title-874");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
