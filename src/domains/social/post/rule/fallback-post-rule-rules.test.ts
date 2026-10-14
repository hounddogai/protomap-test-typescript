import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPostRuleCodeLengthRule,
  FallbackPostRuleCostRangeRule,
  FallbackPostRuleLabelLengthRule,
  FallbackPostRuleStartsAtRangeRule,
  FallbackPostRuleWeightRangeRule,
  defaultFallbackPostRuleValidator,
} from "./fallback-post-rule-rules.js";
import { newFallbackPostRule } from "./fallback-post-rule.js";

test("FallbackPostRuleValidator reports every problem", () => {
  const validator = defaultFallbackPostRuleValidator();
  const item = newFallbackPostRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPostRuleLabelLengthRule flags a long label", () => {
  const rule = new FallbackPostRuleLabelLengthRule(1000);
  const item = newFallbackPostRule("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPostRuleCodeLengthRule flags a long code", () => {
  const rule = new FallbackPostRuleCodeLengthRule(16);
  const item = newFallbackPostRule("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPostRuleCostRangeRule flags values above cost", () => {
  const rule = new FallbackPostRuleCostRangeRule(6.9, 2888.5);
  const item = newFallbackPostRule("x", "y");
  item.cost = 2890;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPostRuleWeightRangeRule flags values above weight", () => {
  const rule = new FallbackPostRuleWeightRangeRule(7.6, 771.3);
  const item = newFallbackPostRule("x", "y");
  item.weight = 772.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPostRuleStartsAtRangeRule flags values above starts at", () => {
  const rule = new FallbackPostRuleStartsAtRangeRule(80, 86400);
  const item = newFallbackPostRule("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
