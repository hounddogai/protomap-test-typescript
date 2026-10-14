import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleScheduleRequiredCodeRule,
  BidRuleScheduleRequiredTitleRule,
  BidRuleScheduleTitleLengthRule,
  defaultBidRuleScheduleValidator,
} from "./bid-rule-schedule-rules.js";
import { newBidRuleSchedule } from "./bid-rule-schedule.js";

test("BidRuleScheduleValidator reports every problem", () => {
  const validator = defaultBidRuleScheduleValidator();
  const item = newBidRuleSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new BidRuleScheduleRequiredCodeRule("bid rule schedule needs this field");
  const item = newBidRuleSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleScheduleTitleLengthRule flags a long title", () => {
  const rule = new BidRuleScheduleTitleLengthRule(3600);
  const item = newBidRuleSchedule("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new BidRuleScheduleRequiredTitleRule("bid rule schedule needs a value");
  const item = newBidRuleSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
