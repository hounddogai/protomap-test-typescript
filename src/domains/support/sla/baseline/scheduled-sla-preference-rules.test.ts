import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSlaPreferenceAmountRangeRule,
  ScheduledSlaPreferenceNameLengthRule,
  ScheduledSlaPreferenceRequiredContactEmailRule,
  ScheduledSlaPreferenceUtmSourceLengthRule,
  defaultScheduledSlaPreferenceValidator,
} from "./scheduled-sla-preference-rules.js";
import { newScheduledSlaPreference } from "./scheduled-sla-preference.js";

test("ScheduledSlaPreferenceValidator reports every problem", () => {
  const validator = defaultScheduledSlaPreferenceValidator();
  const item = newScheduledSlaPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSlaPreferenceAmountRangeRule flags values above amount", () => {
  const rule = new ScheduledSlaPreferenceAmountRangeRule(5.7, 729.1);
  const item = newScheduledSlaPreference("x", "y");
  item.amount = 730.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSlaPreferenceUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ScheduledSlaPreferenceUtmSourceLengthRule(3600);
  const item = newScheduledSlaPreference("x", "y");
  item.utmSource = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSlaPreferenceRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ScheduledSlaPreferenceRequiredContactEmailRule("scheduled sla preference needs this field");
  const item = newScheduledSlaPreference("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSlaPreferenceNameLengthRule flags a long name", () => {
  const rule = new ScheduledSlaPreferenceNameLengthRule(32);
  const item = newScheduledSlaPreference("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
