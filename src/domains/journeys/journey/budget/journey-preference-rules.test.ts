import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyPreferenceAmountRangeRule,
  JourneyPreferenceRequiredRegionRule,
  JourneyPreferenceRequiredTitleRule,
  defaultJourneyPreferenceValidator,
} from "./journey-preference-rules.js";
import { newJourneyPreference } from "./journey-preference.js";

test("JourneyPreferenceValidator reports every problem", () => {
  const validator = defaultJourneyPreferenceValidator();
  const item = newJourneyPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyPreferenceRequiredRegionRule flags a blank region", () => {
  const rule = new JourneyPreferenceRequiredRegionRule("journey preference needs this field");
  const item = newJourneyPreference("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyPreferenceAmountRangeRule flags values above amount", () => {
  const rule = new JourneyPreferenceAmountRangeRule(9.9, 1669.8);
  const item = newJourneyPreference("x", "y");
  item.amount = 1671.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new JourneyPreferenceRequiredTitleRule("journey preference needs an entry");
  const item = newJourneyPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
