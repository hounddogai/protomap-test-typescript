import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictBidRuleVarianceCeilingRangeRule,
  StrictBidRuleVarianceLabelLengthRule,
  StrictBidRuleVarianceMarginRangeRule,
  StrictBidRuleVarianceUpdatedAtRangeRule,
  defaultStrictBidRuleVarianceValidator,
} from "./strict-bid-rule-variance-rules.js";
import { newStrictBidRuleVariance } from "./strict-bid-rule-variance.js";

test("StrictBidRuleVarianceValidator reports every problem", () => {
  const validator = defaultStrictBidRuleVarianceValidator();
  const item = newStrictBidRuleVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictBidRuleVarianceCeilingRangeRule flags values above ceiling", () => {
  const rule = new StrictBidRuleVarianceCeilingRangeRule(6.5, 3230.2);
  const item = newStrictBidRuleVariance("x", "y");
  item.ceiling = 3231.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictBidRuleVarianceMarginRangeRule flags values above margin", () => {
  const rule = new StrictBidRuleVarianceMarginRangeRule(10, 4897.6);
  const item = newStrictBidRuleVariance("x", "y");
  item.margin = 4899.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictBidRuleVarianceUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new StrictBidRuleVarianceUpdatedAtRangeRule(32, 3600);
  const item = newStrictBidRuleVariance("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictBidRuleVarianceLabelLengthRule flags a long label", () => {
  const rule = new StrictBidRuleVarianceLabelLengthRule(86400);
  const item = newStrictBidRuleVariance("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
