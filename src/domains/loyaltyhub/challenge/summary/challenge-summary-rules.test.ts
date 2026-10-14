import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeSummaryCodeLengthRule,
  ChallengeSummaryLimitRangeRule,
  ChallengeSummaryMinimumRangeRule,
  ChallengeSummaryQuantityRangeRule,
  ChallengeSummaryWeightRangeRule,
  defaultChallengeSummaryValidator,
} from "./challenge-summary-rules.js";
import { newChallengeSummary } from "./challenge-summary.js";

test("ChallengeSummaryValidator reports every problem", () => {
  const validator = defaultChallengeSummaryValidator();
  const item = newChallengeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeSummaryQuantityRangeRule flags values above quantity", () => {
  const rule = new ChallengeSummaryQuantityRangeRule(80, 86400);
  const item = newChallengeSummary("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeSummaryLimitRangeRule flags values above limit", () => {
  const rule = new ChallengeSummaryLimitRangeRule(16, 16);
  const item = newChallengeSummary("x", "y");
  item.limit = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeSummaryCodeLengthRule flags a long code", () => {
  const rule = new ChallengeSummaryCodeLengthRule(16);
  const item = newChallengeSummary("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeSummaryWeightRangeRule flags values above weight", () => {
  const rule = new ChallengeSummaryWeightRangeRule(4.9, 1148.5);
  const item = newChallengeSummary("x", "y");
  item.weight = 1150;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeSummaryMinimumRangeRule flags values above minimum", () => {
  const rule = new ChallengeSummaryMinimumRangeRule(1.6, 3923);
  const item = newChallengeSummary("x", "y");
  item.minimum = 3924.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
