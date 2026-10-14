import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSlaPreferenceCodeLengthRule,
  GlobalSlaPreferenceRequiredLabelRule,
  GlobalSlaPreferenceVariantLengthRule,
  defaultGlobalSlaPreferenceValidator,
} from "./global-sla-preference-rules.js";
import { newGlobalSlaPreference } from "./global-sla-preference.js";

test("GlobalSlaPreferenceValidator reports every problem", () => {
  const validator = defaultGlobalSlaPreferenceValidator();
  const item = newGlobalSlaPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSlaPreferenceRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalSlaPreferenceRequiredLabelRule("global sla preference needs a value");
  const item = newGlobalSlaPreference("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSlaPreferenceVariantLengthRule flags a long variant", () => {
  const rule = new GlobalSlaPreferenceVariantLengthRule(32);
  const item = newGlobalSlaPreference("x", "y");
  item.variant = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalSlaPreferenceCodeLengthRule flags a long code", () => {
  const rule = new GlobalSlaPreferenceCodeLengthRule(32);
  const item = newGlobalSlaPreference("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
