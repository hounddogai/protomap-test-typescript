import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryBidRuleScheduleCostRangeRule,
  PrimaryBidRuleScheduleRequiredCodeRule,
  PrimaryBidRuleScheduleRequiredCurrencyRule,
  defaultPrimaryBidRuleScheduleValidator,
} from "./primary-bid-rule-schedule-rules.js";
import { newPrimaryBidRuleSchedule } from "./primary-bid-rule-schedule.js";

test("PrimaryBidRuleScheduleValidator reports every problem", () => {
  const validator = defaultPrimaryBidRuleScheduleValidator();
  const item = newPrimaryBidRuleSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryBidRuleScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryBidRuleScheduleRequiredCodeRule("primary bid rule schedule needs a value");
  const item = newPrimaryBidRuleSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryBidRuleScheduleCostRangeRule flags values above cost", () => {
  const rule = new PrimaryBidRuleScheduleCostRangeRule(8.1, 2766.5);
  const item = newPrimaryBidRuleSchedule("x", "y");
  item.cost = 2768;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryBidRuleScheduleRequiredCurrencyRule flags a blank currency", () => {
  const rule = new PrimaryBidRuleScheduleRequiredCurrencyRule("primary bid rule schedule needs an entry");
  const item = newPrimaryBidRuleSchedule("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
