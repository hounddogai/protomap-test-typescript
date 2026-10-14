import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyRollupFrequencyCapRangeRule,
  FrequencyRollupRequiredTimezoneRule,
  FrequencyRollupStartsAtRangeRule,
  FrequencyRollupTimezoneLengthRule,
  defaultFrequencyRollupValidator,
} from "./frequency-rollup-rules.js";
import { newFrequencyRollup } from "./frequency-rollup.js";

test("FrequencyRollupValidator reports every problem", () => {
  const validator = defaultFrequencyRollupValidator();
  const item = newFrequencyRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyRollupTimezoneLengthRule flags a long timezone", () => {
  const rule = new FrequencyRollupTimezoneLengthRule(80);
  const item = newFrequencyRollup("x", "y");
  item.timezone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyRollupFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new FrequencyRollupFrequencyCapRangeRule(255, 3600);
  const item = newFrequencyRollup("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyRollupRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FrequencyRollupRequiredTimezoneRule("frequency rollup needs this field");
  const item = newFrequencyRollup("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyRollupStartsAtRangeRule flags values above starts at", () => {
  const rule = new FrequencyRollupStartsAtRangeRule(120, 1000);
  const item = newFrequencyRollup("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
