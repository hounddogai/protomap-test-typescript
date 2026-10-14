import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditRollupRequiredTitleRule,
  CreditRollupReviewerLengthRule,
  CreditRollupThresholdRangeRule,
  CreditRollupTitleLengthRule,
  defaultCreditRollupValidator,
} from "./credit-rollup-rules.js";
import { newCreditRollup } from "./credit-rollup.js";

test("CreditRollupValidator reports every problem", () => {
  const validator = defaultCreditRollupValidator();
  const item = newCreditRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditRollupRequiredTitleRule flags a blank title", () => {
  const rule = new CreditRollupRequiredTitleRule("credit rollup needs this field");
  const item = newCreditRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditRollupThresholdRangeRule flags values above threshold", () => {
  const rule = new CreditRollupThresholdRangeRule(3.8, 3160.4);
  const item = newCreditRollup("x", "y");
  item.threshold = 3161.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditRollupReviewerLengthRule flags a long reviewer", () => {
  const rule = new CreditRollupReviewerLengthRule(255);
  const item = newCreditRollup("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditRollupTitleLengthRule flags a long title", () => {
  const rule = new CreditRollupTitleLengthRule(64);
  const item = newCreditRollup("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
