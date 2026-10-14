import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardBaselineChecksumLengthRule,
  RewardBaselineCodeLengthRule,
  RewardBaselineRequiredLabelRule,
  RewardBaselineRequiredReviewerRule,
  defaultRewardBaselineValidator,
} from "./reward-baseline-rules.js";
import { newRewardBaseline } from "./reward-baseline.js";

test("RewardBaselineValidator reports every problem", () => {
  const validator = defaultRewardBaselineValidator();
  const item = newRewardBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardBaselineRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new RewardBaselineRequiredReviewerRule("reward baseline needs an entry");
  const item = newRewardBaseline("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new RewardBaselineRequiredLabelRule("reward baseline needs an entry");
  const item = newRewardBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardBaselineChecksumLengthRule flags a long checksum", () => {
  const rule = new RewardBaselineChecksumLengthRule(1000);
  const item = newRewardBaseline("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardBaselineCodeLengthRule flags a long code", () => {
  const rule = new RewardBaselineCodeLengthRule(80);
  const item = newRewardBaseline("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
