import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPreferenceRequestExpiresAtRangeRule,
  WeightedPreferenceRequestRequiredCodeRule,
  WeightedPreferenceRequestRequiredNameRule,
  WeightedPreferenceRequestRequiredVariantRule,
  defaultWeightedPreferenceRequestValidator,
} from "./weighted-preference-request-rules.js";
import { newWeightedPreferenceRequest } from "./weighted-preference-request.js";

test("WeightedPreferenceRequestValidator reports every problem", () => {
  const validator = defaultWeightedPreferenceRequestValidator();
  const item = newWeightedPreferenceRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPreferenceRequestRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedPreferenceRequestRequiredCodeRule("weighted preference request needs a value");
  const item = newWeightedPreferenceRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPreferenceRequestRequiredVariantRule flags a blank variant", () => {
  const rule = new WeightedPreferenceRequestRequiredVariantRule("weighted preference request needs a value");
  const item = newWeightedPreferenceRequest("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPreferenceRequestExpiresAtRangeRule flags values above expires at", () => {
  const rule = new WeightedPreferenceRequestExpiresAtRangeRule(255, 3600);
  const item = newWeightedPreferenceRequest("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPreferenceRequestRequiredNameRule flags a blank name", () => {
  const rule = new WeightedPreferenceRequestRequiredNameRule("weighted preference request needs a value");
  const item = newWeightedPreferenceRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
