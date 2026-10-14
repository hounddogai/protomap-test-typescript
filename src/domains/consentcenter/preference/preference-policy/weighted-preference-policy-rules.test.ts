import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPreferencePolicyCodeLengthRule,
  WeightedPreferencePolicyLocaleLengthRule,
  WeightedPreferencePolicyRequiredCodeRule,
  WeightedPreferencePolicyRequiredLocaleRule,
  WeightedPreferencePolicyRequiredRegionRule,
  WeightedPreferencePolicyRetriesRangeRule,
  defaultWeightedPreferencePolicyValidator,
} from "./weighted-preference-policy-rules.js";
import { newWeightedPreferencePolicy } from "./weighted-preference-policy.js";

test("WeightedPreferencePolicyValidator reports every problem", () => {
  const validator = defaultWeightedPreferencePolicyValidator();
  const item = newWeightedPreferencePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPreferencePolicyCodeLengthRule flags a long code", () => {
  const rule = new WeightedPreferencePolicyCodeLengthRule(80);
  const item = newWeightedPreferencePolicy("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPreferencePolicyRequiredRegionRule flags a blank region", () => {
  const rule = new WeightedPreferencePolicyRequiredRegionRule("weighted preference policy needs an entry");
  const item = newWeightedPreferencePolicy("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPreferencePolicyRequiredLocaleRule flags a blank locale", () => {
  const rule = new WeightedPreferencePolicyRequiredLocaleRule("weighted preference policy needs a value");
  const item = newWeightedPreferencePolicy("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPreferencePolicyRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedPreferencePolicyRequiredCodeRule("weighted preference policy needs this field");
  const item = newWeightedPreferencePolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPreferencePolicyLocaleLengthRule flags a long locale", () => {
  const rule = new WeightedPreferencePolicyLocaleLengthRule(80);
  const item = newWeightedPreferencePolicy("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPreferencePolicyRetriesRangeRule flags values above retries", () => {
  const rule = new WeightedPreferencePolicyRetriesRangeRule(80, 86400);
  const item = newWeightedPreferencePolicy("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
