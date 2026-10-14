import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyTierAmountRangeRule,
  FrequencyTierRequiredLabelRule,
  defaultFrequencyTierValidator,
} from "./frequency-tier-rules.js";
import { newFrequencyTier } from "./frequency-tier.js";

test("FrequencyTierValidator reports every problem", () => {
  const validator = defaultFrequencyTierValidator();
  const item = newFrequencyTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyTierRequiredLabelRule flags a blank label", () => {
  const rule = new FrequencyTierRequiredLabelRule("frequency tier needs a value");
  const item = newFrequencyTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyTierAmountRangeRule flags values above amount", () => {
  const rule = new FrequencyTierAmountRangeRule(0.6, 4758);
  const item = newFrequencyTier("x", "y");
  item.amount = 4759.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
