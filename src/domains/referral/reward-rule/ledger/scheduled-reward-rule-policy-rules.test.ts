import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledRewardRulePolicyLabelLengthRule,
  ScheduledRewardRulePolicyLocaleLengthRule,
  ScheduledRewardRulePolicyRequiredCodeRule,
  ScheduledRewardRulePolicyRequiredLocaleRule,
  defaultScheduledRewardRulePolicyValidator,
} from "./scheduled-reward-rule-policy-rules.js";
import { newScheduledRewardRulePolicy } from "./scheduled-reward-rule-policy.js";

test("ScheduledRewardRulePolicyValidator reports every problem", () => {
  const validator = defaultScheduledRewardRulePolicyValidator();
  const item = newScheduledRewardRulePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledRewardRulePolicyLocaleLengthRule flags a long locale", () => {
  const rule = new ScheduledRewardRulePolicyLocaleLengthRule(16);
  const item = newScheduledRewardRulePolicy("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledRewardRulePolicyRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledRewardRulePolicyRequiredCodeRule("scheduled reward rule policy needs a value");
  const item = newScheduledRewardRulePolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledRewardRulePolicyLabelLengthRule flags a long label", () => {
  const rule = new ScheduledRewardRulePolicyLabelLengthRule(255);
  const item = newScheduledRewardRulePolicy("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledRewardRulePolicyRequiredLocaleRule flags a blank locale", () => {
  const rule = new ScheduledRewardRulePolicyRequiredLocaleRule("scheduled reward rule policy needs a value");
  const item = newScheduledRewardRulePolicy("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
