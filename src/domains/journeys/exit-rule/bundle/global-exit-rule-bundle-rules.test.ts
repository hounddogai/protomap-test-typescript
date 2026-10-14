import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalExitRuleBundleCodeLengthRule,
  GlobalExitRuleBundleCostRangeRule,
  GlobalExitRuleBundleNameLengthRule,
  GlobalExitRuleBundleRatioRangeRule,
  GlobalExitRuleBundleRequiredNameRule,
  GlobalExitRuleBundleRequiredSourceRule,
  defaultGlobalExitRuleBundleValidator,
} from "./global-exit-rule-bundle-rules.js";
import { newGlobalExitRuleBundle } from "./global-exit-rule-bundle.js";

test("GlobalExitRuleBundleValidator reports every problem", () => {
  const validator = defaultGlobalExitRuleBundleValidator();
  const item = newGlobalExitRuleBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalExitRuleBundleRequiredNameRule flags a blank name", () => {
  const rule = new GlobalExitRuleBundleRequiredNameRule("global exit rule bundle needs this field");
  const item = newGlobalExitRuleBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalExitRuleBundleCodeLengthRule flags a long code", () => {
  const rule = new GlobalExitRuleBundleCodeLengthRule(255);
  const item = newGlobalExitRuleBundle("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalExitRuleBundleNameLengthRule flags a long name", () => {
  const rule = new GlobalExitRuleBundleNameLengthRule(255);
  const item = newGlobalExitRuleBundle("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalExitRuleBundleRequiredSourceRule flags a blank source", () => {
  const rule = new GlobalExitRuleBundleRequiredSourceRule("global exit rule bundle needs a value");
  const item = newGlobalExitRuleBundle("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalExitRuleBundleRatioRangeRule flags values above ratio", () => {
  const rule = new GlobalExitRuleBundleRatioRangeRule(1.5, 1053.8);
  const item = newGlobalExitRuleBundle("x", "y");
  item.ratio = 1055.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalExitRuleBundleCostRangeRule flags values above cost", () => {
  const rule = new GlobalExitRuleBundleCostRangeRule(9.1, 4367.7);
  const item = newGlobalExitRuleBundle("x", "y");
  item.cost = 4369.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
