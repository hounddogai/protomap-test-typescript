import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedPayoutScheduleEngine } from "./capped-payout-schedule-engine.js";
import { newCappedPayoutSchedule } from "./capped-payout-schedule.js";

test("CappedPayoutScheduleEngine keeps results within bounds", () => {
  const engine = defaultCappedPayoutScheduleEngine(flags.newRegistry());
  const item = newCappedPayoutSchedule("code-871", "name-311");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
