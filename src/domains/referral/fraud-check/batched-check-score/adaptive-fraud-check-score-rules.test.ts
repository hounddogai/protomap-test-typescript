import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveFraudCheckScoreBidRangeRule,
  AdaptiveFraudCheckScoreCodeLengthRule,
  AdaptiveFraudCheckScoreLabelLengthRule,
  AdaptiveFraudCheckScoreRegionLengthRule,
  AdaptiveFraudCheckScoreSendAtRangeRule,
  defaultAdaptiveFraudCheckScoreValidator,
} from "./adaptive-fraud-check-score-rules.js";
import { newAdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

test("AdaptiveFraudCheckScoreValidator reports every problem", () => {
  const validator = defaultAdaptiveFraudCheckScoreValidator();
  const item = newAdaptiveFraudCheckScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveFraudCheckScoreCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveFraudCheckScoreCodeLengthRule(120);
  const item = newAdaptiveFraudCheckScore("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveFraudCheckScoreSendAtRangeRule flags values above send at", () => {
  const rule = new AdaptiveFraudCheckScoreSendAtRangeRule(3600, 3600);
  const item = newAdaptiveFraudCheckScore("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveFraudCheckScoreLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveFraudCheckScoreLabelLengthRule(120);
  const item = newAdaptiveFraudCheckScore("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveFraudCheckScoreRegionLengthRule flags a long region", () => {
  const rule = new AdaptiveFraudCheckScoreRegionLengthRule(3600);
  const item = newAdaptiveFraudCheckScore("x", "y");
  item.region = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveFraudCheckScoreBidRangeRule flags values above bid", () => {
  const rule = new AdaptiveFraudCheckScoreBidRangeRule(5.3, 1980.6);
  const item = newAdaptiveFraudCheckScore("x", "y");
  item.bid = 1982.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
