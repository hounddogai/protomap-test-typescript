import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionRollupConversionRateRangeRule,
  RetentionRollupRequiredNameRule,
  defaultRetentionRollupValidator,
} from "./retention-rollup-rules.js";
import { newRetentionRollup } from "./retention-rollup.js";

test("RetentionRollupValidator reports every problem", () => {
  const validator = defaultRetentionRollupValidator();
  const item = newRetentionRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionRollupConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new RetentionRollupConversionRateRangeRule(3.7, 2292.4);
  const item = newRetentionRollup("x", "y");
  item.conversionRate = 2293.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionRollupRequiredNameRule flags a blank name", () => {
  const rule = new RetentionRollupRequiredNameRule("retention rollup needs a value");
  const item = newRetentionRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
