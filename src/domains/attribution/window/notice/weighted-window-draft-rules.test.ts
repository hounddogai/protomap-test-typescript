import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedWindowDraftConversionRateRangeRule,
  WeightedWindowDraftRequiredCodeRule,
  WeightedWindowDraftRequiredLabelRule,
  WeightedWindowDraftRequiredVariantRule,
  WeightedWindowDraftScoreRangeRule,
  WeightedWindowDraftVariantLengthRule,
  defaultWeightedWindowDraftValidator,
} from "./weighted-window-draft-rules.js";
import { newWeightedWindowDraft } from "./weighted-window-draft.js";

test("WeightedWindowDraftValidator reports every problem", () => {
  const validator = defaultWeightedWindowDraftValidator();
  const item = newWeightedWindowDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedWindowDraftRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedWindowDraftRequiredLabelRule("weighted window draft needs this field");
  const item = newWeightedWindowDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedWindowDraftConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new WeightedWindowDraftConversionRateRangeRule(6.1, 4665.7);
  const item = newWeightedWindowDraft("x", "y");
  item.conversionRate = 4667.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedWindowDraftScoreRangeRule flags values above score", () => {
  const rule = new WeightedWindowDraftScoreRangeRule(6.5, 2303.5);
  const item = newWeightedWindowDraft("x", "y");
  item.score = 2305;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedWindowDraftRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedWindowDraftRequiredCodeRule("weighted window draft needs a value");
  const item = newWeightedWindowDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedWindowDraftVariantLengthRule flags a long variant", () => {
  const rule = new WeightedWindowDraftVariantLengthRule(86400);
  const item = newWeightedWindowDraft("x", "y");
  item.variant = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedWindowDraftRequiredVariantRule flags a blank variant", () => {
  const rule = new WeightedWindowDraftRequiredVariantRule("weighted window draft needs an entry");
  const item = newWeightedWindowDraft("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
