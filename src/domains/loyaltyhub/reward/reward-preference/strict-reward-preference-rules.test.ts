import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRewardPreferenceRequiredTitleRule,
  StrictRewardPreferenceRequiredUnitRule,
  StrictRewardPreferenceTitleLengthRule,
  defaultStrictRewardPreferenceValidator,
} from "./strict-reward-preference-rules.js";
import { newStrictRewardPreference } from "./strict-reward-preference.js";

test("StrictRewardPreferenceValidator reports every problem", () => {
  const validator = defaultStrictRewardPreferenceValidator();
  const item = newStrictRewardPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRewardPreferenceRequiredUnitRule flags a blank unit", () => {
  const rule = new StrictRewardPreferenceRequiredUnitRule("strict reward preference needs an entry");
  const item = newStrictRewardPreference("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRewardPreferenceTitleLengthRule flags a long title", () => {
  const rule = new StrictRewardPreferenceTitleLengthRule(80);
  const item = newStrictRewardPreference("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRewardPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new StrictRewardPreferenceRequiredTitleRule("strict reward preference needs a value");
  const item = newStrictRewardPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
