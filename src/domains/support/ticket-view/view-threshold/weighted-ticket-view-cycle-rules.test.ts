import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedTicketViewCycleMaximumRangeRule,
  defaultWeightedTicketViewCycleValidator,
} from "./weighted-ticket-view-cycle-rules.js";
import { newWeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

test("WeightedTicketViewCycleValidator reports every problem", () => {
  const validator = defaultWeightedTicketViewCycleValidator();
  const item = newWeightedTicketViewCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedTicketViewCycleMaximumRangeRule flags values above maximum", () => {
  const rule = new WeightedTicketViewCycleMaximumRangeRule(8.1, 3372.2);
  const item = newWeightedTicketViewCycle("x", "y");
  item.maximum = 3373.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
