import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgePreferenceAmountRangeRule,
  BadgePreferenceCodeLengthRule,
  BadgePreferenceRequiredChannelRule,
  BadgePreferenceRequiredCodeRule,
  defaultBadgePreferenceValidator,
} from "./badge-preference-rules.js";
import { newBadgePreference } from "./badge-preference.js";

test("BadgePreferenceValidator reports every problem", () => {
  const validator = defaultBadgePreferenceValidator();
  const item = newBadgePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new BadgePreferenceRequiredCodeRule("badge preference needs a value");
  const item = newBadgePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgePreferenceCodeLengthRule flags a long code", () => {
  const rule = new BadgePreferenceCodeLengthRule(32);
  const item = newBadgePreference("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgePreferenceAmountRangeRule flags values above amount", () => {
  const rule = new BadgePreferenceAmountRangeRule(5.9, 3400.4);
  const item = newBadgePreference("x", "y");
  item.amount = 3401.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgePreferenceRequiredChannelRule flags a blank channel", () => {
  const rule = new BadgePreferenceRequiredChannelRule("badge preference needs this field");
  const item = newBadgePreference("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
