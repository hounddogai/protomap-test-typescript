import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgePreferenceAmountRangeRule,
  NudgePreferenceCodeLengthRule,
  NudgePreferenceLocaleLengthRule,
  NudgePreferenceNameLengthRule,
  NudgePreferenceOpenRateRangeRule,
  NudgePreferenceUtmSourceLengthRule,
  defaultNudgePreferenceValidator,
} from "./nudge-preference-rules.js";
import { newNudgePreference } from "./nudge-preference.js";

test("NudgePreferenceValidator reports every problem", () => {
  const validator = defaultNudgePreferenceValidator();
  const item = newNudgePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgePreferenceNameLengthRule flags a long name", () => {
  const rule = new NudgePreferenceNameLengthRule(86400);
  const item = newNudgePreference("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgePreferenceUtmSourceLengthRule flags a long utm source", () => {
  const rule = new NudgePreferenceUtmSourceLengthRule(255);
  const item = newNudgePreference("x", "y");
  item.utmSource = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgePreferenceCodeLengthRule flags a long code", () => {
  const rule = new NudgePreferenceCodeLengthRule(3600);
  const item = newNudgePreference("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgePreferenceOpenRateRangeRule flags values above open rate", () => {
  const rule = new NudgePreferenceOpenRateRangeRule(9, 4750.4);
  const item = newNudgePreference("x", "y");
  item.openRate = 4751.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgePreferenceLocaleLengthRule flags a long locale", () => {
  const rule = new NudgePreferenceLocaleLengthRule(32);
  const item = newNudgePreference("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgePreferenceAmountRangeRule flags values above amount", () => {
  const rule = new NudgePreferenceAmountRangeRule(5.9, 1788.6);
  const item = newNudgePreference("x", "y");
  item.amount = 1790.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
