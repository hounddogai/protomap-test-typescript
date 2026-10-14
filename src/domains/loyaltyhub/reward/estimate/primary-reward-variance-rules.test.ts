import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryRewardVarianceCodeLengthRule,
  PrimaryRewardVarianceLabelLengthRule,
  PrimaryRewardVarianceRequiredCodeRule,
  PrimaryRewardVarianceRequiredLabelRule,
  PrimaryRewardVarianceRetriesRangeRule,
  defaultPrimaryRewardVarianceValidator,
} from "./primary-reward-variance-rules.js";
import { newPrimaryRewardVariance } from "./primary-reward-variance.js";

test("PrimaryRewardVarianceValidator reports every problem", () => {
  const validator = defaultPrimaryRewardVarianceValidator();
  const item = newPrimaryRewardVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryRewardVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryRewardVarianceRequiredCodeRule("primary reward variance needs a value");
  const item = newPrimaryRewardVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryRewardVarianceRetriesRangeRule flags values above retries", () => {
  const rule = new PrimaryRewardVarianceRetriesRangeRule(64, 3600);
  const item = newPrimaryRewardVariance("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryRewardVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryRewardVarianceRequiredLabelRule("primary reward variance needs this field");
  const item = newPrimaryRewardVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryRewardVarianceCodeLengthRule flags a long code", () => {
  const rule = new PrimaryRewardVarianceCodeLengthRule(32);
  const item = newPrimaryRewardVariance("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryRewardVarianceLabelLengthRule flags a long label", () => {
  const rule = new PrimaryRewardVarianceLabelLengthRule(80);
  const item = newPrimaryRewardVariance("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
