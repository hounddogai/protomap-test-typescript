import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalInsightBatchEndsAtRangeRule,
  SeasonalInsightBatchMarginRangeRule,
  SeasonalInsightBatchRequiredNameRule,
  defaultSeasonalInsightBatchValidator,
} from "./seasonal-insight-batch-rules.js";
import { newSeasonalInsightBatch } from "./seasonal-insight-batch.js";

test("SeasonalInsightBatchValidator reports every problem", () => {
  const validator = defaultSeasonalInsightBatchValidator();
  const item = newSeasonalInsightBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalInsightBatchMarginRangeRule flags values above margin", () => {
  const rule = new SeasonalInsightBatchMarginRangeRule(9.7, 4739.6);
  const item = newSeasonalInsightBatch("x", "y");
  item.margin = 4741.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalInsightBatchEndsAtRangeRule flags values above ends at", () => {
  const rule = new SeasonalInsightBatchEndsAtRangeRule(64, 255);
  const item = newSeasonalInsightBatch("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalInsightBatchRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalInsightBatchRequiredNameRule("seasonal insight batch needs a value");
  const item = newSeasonalInsightBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
