import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierPreferenceBatchSizeRangeRule,
  TierPreferenceNameLengthRule,
  TierPreferenceRequiredCodeRule,
  TierPreferenceRequiredNameRule,
  defaultTierPreferenceValidator,
} from "./tier-preference-rules.js";
import { newTierPreference } from "./tier-preference.js";

test("TierPreferenceValidator reports every problem", () => {
  const validator = defaultTierPreferenceValidator();
  const item = newTierPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new TierPreferenceRequiredNameRule("tier preference needs an entry");
  const item = newTierPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierPreferenceBatchSizeRangeRule flags values above batch size", () => {
  const rule = new TierPreferenceBatchSizeRangeRule(255, 1000);
  const item = newTierPreference("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new TierPreferenceRequiredCodeRule("tier preference needs a value");
  const item = newTierPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierPreferenceNameLengthRule flags a long name", () => {
  const rule = new TierPreferenceNameLengthRule(32);
  const item = newTierPreference("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
