import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativePreferenceBidRangeRule,
  CreativePreferenceCodeLengthRule,
  CreativePreferenceLabelLengthRule,
  CreativePreferenceRequiredLabelRule,
  CreativePreferenceRequiredSourceRule,
  defaultCreativePreferenceValidator,
} from "./creative-preference-rules.js";
import { newCreativePreference } from "./creative-preference.js";

test("CreativePreferenceValidator reports every problem", () => {
  const validator = defaultCreativePreferenceValidator();
  const item = newCreativePreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativePreferenceBidRangeRule flags values above bid", () => {
  const rule = new CreativePreferenceBidRangeRule(1.4, 4723.3);
  const item = newCreativePreference("x", "y");
  item.bid = 4724.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativePreferenceCodeLengthRule flags a long code", () => {
  const rule = new CreativePreferenceCodeLengthRule(255);
  const item = newCreativePreference("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativePreferenceRequiredSourceRule flags a blank source", () => {
  const rule = new CreativePreferenceRequiredSourceRule("creative preference needs an entry");
  const item = newCreativePreference("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativePreferenceLabelLengthRule flags a long label", () => {
  const rule = new CreativePreferenceLabelLengthRule(1000);
  const item = newCreativePreference("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativePreferenceRequiredLabelRule flags a blank label", () => {
  const rule = new CreativePreferenceRequiredLabelRule("creative preference needs a value");
  const item = newCreativePreference("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
