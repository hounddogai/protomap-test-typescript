import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayoutScheduleEngine } from "./payout-schedule-engine.js";
import { newPayoutSchedule } from "./payout-schedule.js";

test("PayoutScheduleEngine keeps results within bounds", () => {
  const engine = defaultPayoutScheduleEngine();
  const item = newPayoutSchedule("code-487", "name-241");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
