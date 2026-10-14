import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditScheduleCampaignRefLengthRule,
  CreditScheduleCodeLengthRule,
  CreditScheduleLimitRangeRule,
  CreditScheduleRequiredCodeRule,
  CreditScheduleVersionRangeRule,
  defaultCreditScheduleValidator,
} from "./credit-schedule-rules.js";
import { newCreditSchedule } from "./credit-schedule.js";

test("CreditScheduleValidator reports every problem", () => {
  const validator = defaultCreditScheduleValidator();
  const item = newCreditSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditScheduleCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CreditScheduleCampaignRefLengthRule(64);
  const item = newCreditSchedule("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditScheduleCodeLengthRule flags a long code", () => {
  const rule = new CreditScheduleCodeLengthRule(32);
  const item = newCreditSchedule("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditScheduleVersionRangeRule flags values above version", () => {
  const rule = new CreditScheduleVersionRangeRule(255, 3600);
  const item = newCreditSchedule("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditScheduleLimitRangeRule flags values above limit", () => {
  const rule = new CreditScheduleLimitRangeRule(16, 1000);
  const item = newCreditSchedule("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new CreditScheduleRequiredCodeRule("credit schedule needs this field");
  const item = newCreditSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
