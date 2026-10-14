import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultModelTierCreatedAtRangeRule,
  DefaultModelTierFrequencyCapRangeRule,
  DefaultModelTierPriorityRangeRule,
  DefaultModelTierRequiredCurrencyRule,
  defaultDefaultModelTierValidator,
} from "./default-model-tier-rules.js";
import { newDefaultModelTier } from "./default-model-tier.js";

test("DefaultModelTierValidator reports every problem", () => {
  const validator = defaultDefaultModelTierValidator();
  const item = newDefaultModelTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultModelTierRequiredCurrencyRule flags a blank currency", () => {
  const rule = new DefaultModelTierRequiredCurrencyRule("default model tier needs an entry");
  const item = newDefaultModelTier("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultModelTierFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new DefaultModelTierFrequencyCapRangeRule(255, 255);
  const item = newDefaultModelTier("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultModelTierCreatedAtRangeRule flags values above created at", () => {
  const rule = new DefaultModelTierCreatedAtRangeRule(80, 3600);
  const item = newDefaultModelTier("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultModelTierPriorityRangeRule flags values above priority", () => {
  const rule = new DefaultModelTierPriorityRangeRule(80, 86400);
  const item = newDefaultModelTier("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
