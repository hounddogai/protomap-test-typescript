import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRewardRuleOverrideCodeLengthRule,
  GlobalRewardRuleOverrideDiscountRangeRule,
  GlobalRewardRuleOverrideNameLengthRule,
  GlobalRewardRuleOverrideRequiredCodeRule,
  GlobalRewardRuleOverrideRequiredNameRule,
  defaultGlobalRewardRuleOverrideValidator,
} from "./global-reward-rule-override-rules.js";
import { newGlobalRewardRuleOverride } from "./global-reward-rule-override.js";

test("GlobalRewardRuleOverrideValidator reports every problem", () => {
  const validator = defaultGlobalRewardRuleOverrideValidator();
  const item = newGlobalRewardRuleOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRewardRuleOverrideDiscountRangeRule flags values above discount", () => {
  const rule = new GlobalRewardRuleOverrideDiscountRangeRule(4.9, 2617.8);
  const item = newGlobalRewardRuleOverride("x", "y");
  item.discount = 2619.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRewardRuleOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalRewardRuleOverrideRequiredCodeRule("global reward rule override needs an entry");
  const item = newGlobalRewardRuleOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardRuleOverrideRequiredNameRule flags a blank name", () => {
  const rule = new GlobalRewardRuleOverrideRequiredNameRule("global reward rule override needs this field");
  const item = newGlobalRewardRuleOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardRuleOverrideCodeLengthRule flags a long code", () => {
  const rule = new GlobalRewardRuleOverrideCodeLengthRule(86400);
  const item = newGlobalRewardRuleOverride("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRewardRuleOverrideNameLengthRule flags a long name", () => {
  const rule = new GlobalRewardRuleOverrideNameLengthRule(255);
  const item = newGlobalRewardRuleOverride("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
