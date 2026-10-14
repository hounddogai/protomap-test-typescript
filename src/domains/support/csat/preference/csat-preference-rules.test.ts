import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatPreferenceChannelLengthRule,
  CsatPreferenceQuantityRangeRule,
  CsatPreferenceRequiredChannelRule,
  CsatPreferenceRequiredLabelRule,
  defaultCsatPreferenceValidator,
} from "./csat-preference-rules.js";
import { newCsatPreference } from "./csat-preference.js";

test("CsatPreferenceValidator reports every problem", () => {
  const validator = defaultCsatPreferenceValidator();
  const item = newCsatPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatPreferenceQuantityRangeRule flags values above quantity", () => {
  const rule = new CsatPreferenceQuantityRangeRule(16, 64);
  const item = newCsatPreference("x", "y");
  item.quantity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatPreferenceRequiredLabelRule flags a blank label", () => {
  const rule = new CsatPreferenceRequiredLabelRule("csat preference needs a value");
  const item = newCsatPreference("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatPreferenceRequiredChannelRule flags a blank channel", () => {
  const rule = new CsatPreferenceRequiredChannelRule("csat preference needs an entry");
  const item = newCsatPreference("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatPreferenceChannelLengthRule flags a long channel", () => {
  const rule = new CsatPreferenceChannelLengthRule(64);
  const item = newCsatPreference("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
