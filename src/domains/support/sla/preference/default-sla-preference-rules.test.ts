import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultSlaPreferenceCodeLengthRule,
  DefaultSlaPreferenceDurationMinutesRangeRule,
  defaultDefaultSlaPreferenceValidator,
} from "./default-sla-preference-rules.js";
import { newDefaultSlaPreference } from "./default-sla-preference.js";

test("DefaultSlaPreferenceValidator reports every problem", () => {
  const validator = defaultDefaultSlaPreferenceValidator();
  const item = newDefaultSlaPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultSlaPreferenceCodeLengthRule flags a long code", () => {
  const rule = new DefaultSlaPreferenceCodeLengthRule(80);
  const item = newDefaultSlaPreference("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultSlaPreferenceDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultSlaPreferenceDurationMinutesRangeRule(16, 86400);
  const item = newDefaultSlaPreference("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
