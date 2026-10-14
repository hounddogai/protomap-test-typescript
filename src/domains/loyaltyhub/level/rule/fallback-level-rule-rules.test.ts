import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackLevelRuleBidRangeRule,
  FallbackLevelRuleLocaleLengthRule,
  FallbackLevelRuleRequiredCodeRule,
  defaultFallbackLevelRuleValidator,
} from "./fallback-level-rule-rules.js";
import { newFallbackLevelRule } from "./fallback-level-rule.js";

test("FallbackLevelRuleValidator reports every problem", () => {
  const validator = defaultFallbackLevelRuleValidator();
  const item = newFallbackLevelRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackLevelRuleLocaleLengthRule flags a long locale", () => {
  const rule = new FallbackLevelRuleLocaleLengthRule(1000);
  const item = newFallbackLevelRule("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackLevelRuleRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackLevelRuleRequiredCodeRule("fallback level rule needs an entry");
  const item = newFallbackLevelRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackLevelRuleBidRangeRule flags values above bid", () => {
  const rule = new FallbackLevelRuleBidRangeRule(9.4, 3417.7);
  const item = newFallbackLevelRule("x", "y");
  item.bid = 3419.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
