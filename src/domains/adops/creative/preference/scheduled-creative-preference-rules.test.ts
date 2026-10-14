import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledCreativePreferenceCodeLengthRule,
  ScheduledCreativePreferenceRequiredCampaignRefRule,
  ScheduledCreativePreferenceRequiredCodeRule,
  defaultScheduledCreativePreferenceValidator,
} from "./scheduled-creative-preference-rules.js";
import { newScheduledCreativePreference } from "./scheduled-creative-preference.js";

test("ScheduledCreativePreferenceValidator reports every problem", () => {
  const validator = defaultScheduledCreativePreferenceValidator();
  const item = newScheduledCreativePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledCreativePreferenceCodeLengthRule flags a long code", () => {
  const rule = new ScheduledCreativePreferenceCodeLengthRule(1000);
  const item = newScheduledCreativePreference("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledCreativePreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledCreativePreferenceRequiredCodeRule("scheduled creative preference needs a value");
  const item = newScheduledCreativePreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledCreativePreferenceRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ScheduledCreativePreferenceRequiredCampaignRefRule("scheduled creative preference needs this field");
  const item = newScheduledCreativePreference("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
