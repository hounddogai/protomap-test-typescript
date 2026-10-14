import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryLevelWindowBatchSizeRangeRule,
  PrimaryLevelWindowCategoryLengthRule,
  PrimaryLevelWindowCodeLengthRule,
  PrimaryLevelWindowConversionRateRangeRule,
  PrimaryLevelWindowNameLengthRule,
  PrimaryLevelWindowRequiredLabelRule,
  defaultPrimaryLevelWindowValidator,
} from "./primary-level-window-rules.js";
import { newPrimaryLevelWindow } from "./primary-level-window.js";

test("PrimaryLevelWindowValidator reports every problem", () => {
  const validator = defaultPrimaryLevelWindowValidator();
  const item = newPrimaryLevelWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryLevelWindowNameLengthRule flags a long name", () => {
  const rule = new PrimaryLevelWindowNameLengthRule(255);
  const item = newPrimaryLevelWindow("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryLevelWindowRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryLevelWindowRequiredLabelRule("primary level window needs an entry");
  const item = newPrimaryLevelWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryLevelWindowCodeLengthRule flags a long code", () => {
  const rule = new PrimaryLevelWindowCodeLengthRule(120);
  const item = newPrimaryLevelWindow("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryLevelWindowConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PrimaryLevelWindowConversionRateRangeRule(6.9, 1559.3);
  const item = newPrimaryLevelWindow("x", "y");
  item.conversionRate = 1560.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryLevelWindowCategoryLengthRule flags a long category", () => {
  const rule = new PrimaryLevelWindowCategoryLengthRule(120);
  const item = newPrimaryLevelWindow("x", "y");
  item.category = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryLevelWindowBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PrimaryLevelWindowBatchSizeRangeRule(1000, 86400);
  const item = newPrimaryLevelWindow("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
