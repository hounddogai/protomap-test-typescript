import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedCreativeEntryCodeLengthRule,
  WeightedCreativeEntryConversionRateRangeRule,
  WeightedCreativeEntryLabelLengthRule,
  WeightedCreativeEntryRequiredLabelRule,
  WeightedCreativeEntryRequiredPhoneRule,
  WeightedCreativeEntryRequiredTitleRule,
  defaultWeightedCreativeEntryValidator,
} from "./weighted-creative-entry-rules.js";
import { newWeightedCreativeEntry } from "./weighted-creative-entry.js";

test("WeightedCreativeEntryValidator reports every problem", () => {
  const validator = defaultWeightedCreativeEntryValidator();
  const item = newWeightedCreativeEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedCreativeEntryCodeLengthRule flags a long code", () => {
  const rule = new WeightedCreativeEntryCodeLengthRule(32);
  const item = newWeightedCreativeEntry("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCreativeEntryRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedCreativeEntryRequiredTitleRule("weighted creative entry needs a value");
  const item = newWeightedCreativeEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedCreativeEntryConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new WeightedCreativeEntryConversionRateRangeRule(5.5, 115.4);
  const item = newWeightedCreativeEntry("x", "y");
  item.conversionRate = 116.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCreativeEntryRequiredPhoneRule flags a blank phone", () => {
  const rule = new WeightedCreativeEntryRequiredPhoneRule("weighted creative entry needs an entry");
  const item = newWeightedCreativeEntry("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedCreativeEntryLabelLengthRule flags a long label", () => {
  const rule = new WeightedCreativeEntryLabelLengthRule(80);
  const item = newWeightedCreativeEntry("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCreativeEntryRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedCreativeEntryRequiredLabelRule("weighted creative entry needs this field");
  const item = newWeightedCreativeEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
