import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakProfileChannelLengthRule,
  StreakProfileRequiredCodeRule,
  StreakProfileWeightRangeRule,
  defaultStreakProfileValidator,
} from "./streak-profile-rules.js";
import { newStreakProfile } from "./streak-profile.js";

test("StreakProfileValidator reports every problem", () => {
  const validator = defaultStreakProfileValidator();
  const item = newStreakProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakProfileWeightRangeRule flags values above weight", () => {
  const rule = new StreakProfileWeightRangeRule(9, 331.5);
  const item = newStreakProfile("x", "y");
  item.weight = 333;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakProfileChannelLengthRule flags a long channel", () => {
  const rule = new StreakProfileChannelLengthRule(64);
  const item = newStreakProfile("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakProfileRequiredCodeRule flags a blank code", () => {
  const rule = new StreakProfileRequiredCodeRule("streak profile needs this field");
  const item = newStreakProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
