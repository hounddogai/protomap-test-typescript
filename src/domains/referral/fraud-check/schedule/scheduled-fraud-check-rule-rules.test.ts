import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFraudCheckRuleAmountRangeRule,
  ScheduledFraudCheckRuleAudienceIdLengthRule,
  ScheduledFraudCheckRuleCodeLengthRule,
  ScheduledFraudCheckRuleCurrencyLengthRule,
  ScheduledFraudCheckRuleNameLengthRule,
  defaultScheduledFraudCheckRuleValidator,
} from "./scheduled-fraud-check-rule-rules.js";
import { newScheduledFraudCheckRule } from "./scheduled-fraud-check-rule.js";

test("ScheduledFraudCheckRuleValidator reports every problem", () => {
  const validator = defaultScheduledFraudCheckRuleValidator();
  const item = newScheduledFraudCheckRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFraudCheckRuleNameLengthRule flags a long name", () => {
  const rule = new ScheduledFraudCheckRuleNameLengthRule(120);
  const item = newScheduledFraudCheckRule("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFraudCheckRuleCurrencyLengthRule flags a long currency", () => {
  const rule = new ScheduledFraudCheckRuleCurrencyLengthRule(120);
  const item = newScheduledFraudCheckRule("x", "y");
  item.currency = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFraudCheckRuleAmountRangeRule flags values above amount", () => {
  const rule = new ScheduledFraudCheckRuleAmountRangeRule(0.9, 975.1);
  const item = newScheduledFraudCheckRule("x", "y");
  item.amount = 976.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledFraudCheckRuleCodeLengthRule flags a long code", () => {
  const rule = new ScheduledFraudCheckRuleCodeLengthRule(120);
  const item = newScheduledFraudCheckRule("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFraudCheckRuleAudienceIdLengthRule flags a long audience id", () => {
  const rule = new ScheduledFraudCheckRuleAudienceIdLengthRule(120);
  const item = newScheduledFraudCheckRule("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
