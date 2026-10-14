import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledNudgePreferenceLabelLengthRule,
  ScheduledNudgePreferenceSummaryLengthRule,
  ScheduledNudgePreferenceWeightRangeRule,
  defaultScheduledNudgePreferenceValidator,
} from "./scheduled-nudge-preference-rules.js";
import { newScheduledNudgePreference } from "./scheduled-nudge-preference.js";

test("ScheduledNudgePreferenceValidator reports every problem", () => {
  const validator = defaultScheduledNudgePreferenceValidator();
  const item = newScheduledNudgePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledNudgePreferenceLabelLengthRule flags a long label", () => {
  const rule = new ScheduledNudgePreferenceLabelLengthRule(16);
  const item = newScheduledNudgePreference("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledNudgePreferenceSummaryLengthRule flags a long summary", () => {
  const rule = new ScheduledNudgePreferenceSummaryLengthRule(3600);
  const item = newScheduledNudgePreference("x", "y");
  item.summary = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledNudgePreferenceWeightRangeRule flags values above weight", () => {
  const rule = new ScheduledNudgePreferenceWeightRangeRule(9.3, 1730.3);
  const item = newScheduledNudgePreference("x", "y");
  item.weight = 1731.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
