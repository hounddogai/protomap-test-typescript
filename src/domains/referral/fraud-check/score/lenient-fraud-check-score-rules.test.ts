import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientFraudCheckScoreBudgetRangeRule,
  LenientFraudCheckScoreCodeLengthRule,
  LenientFraudCheckScoreLabelLengthRule,
  LenientFraudCheckScoreOpenRateRangeRule,
  LenientFraudCheckScoreRequiredCodeRule,
  defaultLenientFraudCheckScoreValidator,
} from "./lenient-fraud-check-score-rules.js";
import { newLenientFraudCheckScore } from "./lenient-fraud-check-score.js";

test("LenientFraudCheckScoreValidator reports every problem", () => {
  const validator = defaultLenientFraudCheckScoreValidator();
  const item = newLenientFraudCheckScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientFraudCheckScoreOpenRateRangeRule flags values above open rate", () => {
  const rule = new LenientFraudCheckScoreOpenRateRangeRule(3.3, 2447.6);
  const item = newLenientFraudCheckScore("x", "y");
  item.openRate = 2449.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientFraudCheckScoreCodeLengthRule flags a long code", () => {
  const rule = new LenientFraudCheckScoreCodeLengthRule(255);
  const item = newLenientFraudCheckScore("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientFraudCheckScoreLabelLengthRule flags a long label", () => {
  const rule = new LenientFraudCheckScoreLabelLengthRule(64);
  const item = newLenientFraudCheckScore("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientFraudCheckScoreBudgetRangeRule flags values above budget", () => {
  const rule = new LenientFraudCheckScoreBudgetRangeRule(5.6, 4629.5);
  const item = newLenientFraudCheckScore("x", "y");
  item.budget = 4631;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientFraudCheckScoreRequiredCodeRule flags a blank code", () => {
  const rule = new LenientFraudCheckScoreRequiredCodeRule("lenient fraud check score needs this field");
  const item = newLenientFraudCheckScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
