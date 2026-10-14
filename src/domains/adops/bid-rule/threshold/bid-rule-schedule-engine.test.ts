import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleScheduleEngine } from "./bid-rule-schedule-engine.js";
import { newBidRuleSchedule } from "./bid-rule-schedule.js";

test("BidRuleScheduleEngine keeps results within bounds", () => {
  const engine = defaultBidRuleScheduleEngine(flags.newRegistry());
  const item = newBidRuleSchedule("code-881", "title-59");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
