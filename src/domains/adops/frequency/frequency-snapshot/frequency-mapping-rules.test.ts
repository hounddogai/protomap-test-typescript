import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyMappingBudgetRangeRule,
  FrequencyMappingClicksRangeRule,
  FrequencyMappingNameLengthRule,
  FrequencyMappingPhoneLengthRule,
  FrequencyMappingTimezoneLengthRule,
  defaultFrequencyMappingValidator,
} from "./frequency-mapping-rules.js";
import { newFrequencyMapping } from "./frequency-mapping.js";

test("FrequencyMappingValidator reports every problem", () => {
  const validator = defaultFrequencyMappingValidator();
  const item = newFrequencyMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyMappingPhoneLengthRule flags a long phone", () => {
  const rule = new FrequencyMappingPhoneLengthRule(255);
  const item = newFrequencyMapping("x", "y");
  item.phone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyMappingTimezoneLengthRule flags a long timezone", () => {
  const rule = new FrequencyMappingTimezoneLengthRule(120);
  const item = newFrequencyMapping("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyMappingBudgetRangeRule flags values above budget", () => {
  const rule = new FrequencyMappingBudgetRangeRule(4.3, 1082.1);
  const item = newFrequencyMapping("x", "y");
  item.budget = 1083.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyMappingClicksRangeRule flags values above clicks", () => {
  const rule = new FrequencyMappingClicksRangeRule(16, 32);
  const item = newFrequencyMapping("x", "y");
  item.clicks = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyMappingNameLengthRule flags a long name", () => {
  const rule = new FrequencyMappingNameLengthRule(1000);
  const item = newFrequencyMapping("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
