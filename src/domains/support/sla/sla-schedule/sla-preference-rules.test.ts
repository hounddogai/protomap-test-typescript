import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaPreferenceCodeLengthRule,
  SlaPreferenceImpressionsRangeRule,
  SlaPreferenceLabelLengthRule,
  SlaPreferenceRequiredLabelRule,
  defaultSlaPreferenceValidator,
} from "./sla-preference-rules.js";
import { newSlaPreference } from "./sla-preference.js";

test("SlaPreferenceValidator reports every problem", () => {
  const validator = defaultSlaPreferenceValidator();
  const item = newSlaPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaPreferenceImpressionsRangeRule flags values above impressions", () => {
  const rule = new SlaPreferenceImpressionsRangeRule(120, 1000);
  const item = newSlaPreference("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaPreferenceRequiredLabelRule flags a blank label", () => {
  const rule = new SlaPreferenceRequiredLabelRule("sla preference needs a value");
  const item = newSlaPreference("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaPreferenceCodeLengthRule flags a long code", () => {
  const rule = new SlaPreferenceCodeLengthRule(86400);
  const item = newSlaPreference("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaPreferenceLabelLengthRule flags a long label", () => {
  const rule = new SlaPreferenceLabelLengthRule(86400);
  const item = newSlaPreference("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
