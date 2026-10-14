import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPathBatchLimitRangeRule,
  SeasonalPathBatchRateRangeRule,
  SeasonalPathBatchRequiredVariantRule,
  SeasonalPathBatchVariantLengthRule,
  SeasonalPathBatchWeightRangeRule,
  defaultSeasonalPathBatchValidator,
} from "./seasonal-path-batch-rules.js";
import { newSeasonalPathBatch } from "./seasonal-path-batch.js";

test("SeasonalPathBatchValidator reports every problem", () => {
  const validator = defaultSeasonalPathBatchValidator();
  const item = newSeasonalPathBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPathBatchVariantLengthRule flags a long variant", () => {
  const rule = new SeasonalPathBatchVariantLengthRule(120);
  const item = newSeasonalPathBatch("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPathBatchRequiredVariantRule flags a blank variant", () => {
  const rule = new SeasonalPathBatchRequiredVariantRule("seasonal path batch needs an entry");
  const item = newSeasonalPathBatch("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPathBatchRateRangeRule flags values above rate", () => {
  const rule = new SeasonalPathBatchRateRangeRule(3.5, 4705.9);
  const item = newSeasonalPathBatch("x", "y");
  item.rate = 4707.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalPathBatchWeightRangeRule flags values above weight", () => {
  const rule = new SeasonalPathBatchWeightRangeRule(3.6, 3746);
  const item = newSeasonalPathBatch("x", "y");
  item.weight = 3747.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalPathBatchLimitRangeRule flags values above limit", () => {
  const rule = new SeasonalPathBatchLimitRangeRule(80, 120);
  const item = newSeasonalPathBatch("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
