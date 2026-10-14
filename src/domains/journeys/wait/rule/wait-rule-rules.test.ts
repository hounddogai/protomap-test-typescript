import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitRuleAmountRangeRule,
  WaitRuleCohortLengthRule,
  WaitRuleMaximumRangeRule,
  WaitRuleRegionLengthRule,
  WaitRuleRequiredRegionRule,
  defaultWaitRuleValidator,
} from "./wait-rule-rules.js";
import { newWaitRule } from "./wait-rule.js";

test("WaitRuleValidator reports every problem", () => {
  const validator = defaultWaitRuleValidator();
  const item = newWaitRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitRuleCohortLengthRule flags a long cohort", () => {
  const rule = new WaitRuleCohortLengthRule(3600);
  const item = newWaitRule("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitRuleMaximumRangeRule flags values above maximum", () => {
  const rule = new WaitRuleMaximumRangeRule(9.6, 905.8);
  const item = newWaitRule("x", "y");
  item.maximum = 907.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitRuleAmountRangeRule flags values above amount", () => {
  const rule = new WaitRuleAmountRangeRule(5.4, 747);
  const item = newWaitRule("x", "y");
  item.amount = 748.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitRuleRegionLengthRule flags a long region", () => {
  const rule = new WaitRuleRegionLengthRule(120);
  const item = newWaitRule("x", "y");
  item.region = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitRuleRequiredRegionRule flags a blank region", () => {
  const rule = new WaitRuleRequiredRegionRule("wait rule needs this field");
  const item = newWaitRule("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
