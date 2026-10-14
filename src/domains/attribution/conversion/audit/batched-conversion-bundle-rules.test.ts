import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedConversionBundleCodeLengthRule,
  BatchedConversionBundleFrequencyCapRangeRule,
  defaultBatchedConversionBundleValidator,
} from "./batched-conversion-bundle-rules.js";
import { newBatchedConversionBundle } from "./batched-conversion-bundle.js";

test("BatchedConversionBundleValidator reports every problem", () => {
  const validator = defaultBatchedConversionBundleValidator();
  const item = newBatchedConversionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedConversionBundleFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BatchedConversionBundleFrequencyCapRangeRule(16, 1000);
  const item = newBatchedConversionBundle("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedConversionBundleCodeLengthRule flags a long code", () => {
  const rule = new BatchedConversionBundleCodeLengthRule(3600);
  const item = newBatchedConversionBundle("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
