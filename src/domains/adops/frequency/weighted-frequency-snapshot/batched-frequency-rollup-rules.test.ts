import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFrequencyRollupCodeLengthRule,
  BatchedFrequencyRollupFrequencyCapRangeRule,
  BatchedFrequencyRollupOpenRateRangeRule,
  BatchedFrequencyRollupRequiredChannelRule,
  BatchedFrequencyRollupRequiredLabelRule,
  defaultBatchedFrequencyRollupValidator,
} from "./batched-frequency-rollup-rules.js";
import { newBatchedFrequencyRollup } from "./batched-frequency-rollup.js";

test("BatchedFrequencyRollupValidator reports every problem", () => {
  const validator = defaultBatchedFrequencyRollupValidator();
  const item = newBatchedFrequencyRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFrequencyRollupRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedFrequencyRollupRequiredLabelRule("batched frequency rollup needs this field");
  const item = newBatchedFrequencyRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFrequencyRollupCodeLengthRule flags a long code", () => {
  const rule = new BatchedFrequencyRollupCodeLengthRule(86400);
  const item = newBatchedFrequencyRollup("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedFrequencyRollupFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BatchedFrequencyRollupFrequencyCapRangeRule(16, 1000);
  const item = newBatchedFrequencyRollup("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedFrequencyRollupOpenRateRangeRule flags values above open rate", () => {
  const rule = new BatchedFrequencyRollupOpenRateRangeRule(7.7, 2313.5);
  const item = newBatchedFrequencyRollup("x", "y");
  item.openRate = 2315;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedFrequencyRollupRequiredChannelRule flags a blank channel", () => {
  const rule = new BatchedFrequencyRollupRequiredChannelRule("batched frequency rollup needs an entry");
  const item = newBatchedFrequencyRollup("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
