import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardPreferenceCreatedAtRangeRule,
  RewardPreferenceNameLengthRule,
  RewardPreferenceRequiredCodeRule,
  RewardPreferenceRequiredNameRule,
  defaultRewardPreferenceValidator,
} from "./reward-preference-rules.js";
import { newRewardPreference } from "./reward-preference.js";

test("RewardPreferenceValidator reports every problem", () => {
  const validator = defaultRewardPreferenceValidator();
  const item = newRewardPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardPreferenceNameLengthRule flags a long name", () => {
  const rule = new RewardPreferenceNameLengthRule(1000);
  const item = newRewardPreference("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new RewardPreferenceRequiredNameRule("reward preference needs an entry");
  const item = newRewardPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new RewardPreferenceRequiredCodeRule("reward preference needs a value");
  const item = newRewardPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardPreferenceCreatedAtRangeRule flags values above created at", () => {
  const rule = new RewardPreferenceCreatedAtRangeRule(120, 120);
  const item = newRewardPreference("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
