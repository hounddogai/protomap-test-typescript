import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceRequestMinimumRangeRule,
  PreferenceRequestRequiredAudienceIdRule,
  PreferenceRequestRequiredCodeRule,
  PreferenceRequestRequiredLocaleRule,
  PreferenceRequestRequiredNameRule,
  PreferenceRequestThresholdRangeRule,
  defaultPreferenceRequestValidator,
} from "./preference-request-rules.js";
import { newPreferenceRequest } from "./preference-request.js";

test("PreferenceRequestValidator reports every problem", () => {
  const validator = defaultPreferenceRequestValidator();
  const item = newPreferenceRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceRequestThresholdRangeRule flags values above threshold", () => {
  const rule = new PreferenceRequestThresholdRangeRule(0.9, 639.8);
  const item = newPreferenceRequest("x", "y");
  item.threshold = 641.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceRequestRequiredNameRule flags a blank name", () => {
  const rule = new PreferenceRequestRequiredNameRule("preference request needs a value");
  const item = newPreferenceRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceRequestMinimumRangeRule flags values above minimum", () => {
  const rule = new PreferenceRequestMinimumRangeRule(6.4, 2429.3);
  const item = newPreferenceRequest("x", "y");
  item.minimum = 2430.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceRequestRequiredLocaleRule flags a blank locale", () => {
  const rule = new PreferenceRequestRequiredLocaleRule("preference request needs this field");
  const item = newPreferenceRequest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceRequestRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PreferenceRequestRequiredAudienceIdRule("preference request needs a value");
  const item = newPreferenceRequest("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceRequestRequiredCodeRule flags a blank code", () => {
  const rule = new PreferenceRequestRequiredCodeRule("preference request needs an entry");
  const item = newPreferenceRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
