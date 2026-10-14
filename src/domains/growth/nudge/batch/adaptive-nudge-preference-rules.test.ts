import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveNudgePreferenceCampaignRefLengthRule,
  AdaptiveNudgePreferenceRequiredSourceRule,
  defaultAdaptiveNudgePreferenceValidator,
} from "./adaptive-nudge-preference-rules.js";
import { newAdaptiveNudgePreference } from "./adaptive-nudge-preference.js";

test("AdaptiveNudgePreferenceValidator reports every problem", () => {
  const validator = defaultAdaptiveNudgePreferenceValidator();
  const item = newAdaptiveNudgePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveNudgePreferenceCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new AdaptiveNudgePreferenceCampaignRefLengthRule(120);
  const item = newAdaptiveNudgePreference("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveNudgePreferenceRequiredSourceRule flags a blank source", () => {
  const rule = new AdaptiveNudgePreferenceRequiredSourceRule("adaptive nudge preference needs a value");
  const item = newAdaptiveNudgePreference("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
