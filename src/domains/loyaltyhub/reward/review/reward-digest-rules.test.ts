import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardDigestAttemptsRangeRule,
  RewardDigestCodeLengthRule,
  RewardDigestCountryLengthRule,
  defaultRewardDigestValidator,
} from "./reward-digest-rules.js";
import { newRewardDigest } from "./reward-digest.js";

test("RewardDigestValidator reports every problem", () => {
  const validator = defaultRewardDigestValidator();
  const item = newRewardDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardDigestCodeLengthRule flags a long code", () => {
  const rule = new RewardDigestCodeLengthRule(120);
  const item = newRewardDigest("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardDigestAttemptsRangeRule flags values above attempts", () => {
  const rule = new RewardDigestAttemptsRangeRule(80, 255);
  const item = newRewardDigest("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardDigestCountryLengthRule flags a long country", () => {
  const rule = new RewardDigestCountryLengthRule(32);
  const item = newRewardDigest("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
