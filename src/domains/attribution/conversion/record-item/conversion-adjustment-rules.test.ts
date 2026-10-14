import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionAdjustmentBidRangeRule,
  ConversionAdjustmentBudgetRangeRule,
  ConversionAdjustmentCodeLengthRule,
  ConversionAdjustmentRequiredDescriptionRule,
  ConversionAdjustmentRequiredTitleRule,
  ConversionAdjustmentSequenceRangeRule,
  defaultConversionAdjustmentValidator,
} from "./conversion-adjustment-rules.js";
import { newConversionAdjustment } from "./conversion-adjustment.js";

test("ConversionAdjustmentValidator reports every problem", () => {
  const validator = defaultConversionAdjustmentValidator();
  const item = newConversionAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new ConversionAdjustmentRequiredTitleRule("conversion adjustment needs an entry");
  const item = newConversionAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new ConversionAdjustmentCodeLengthRule(1000);
  const item = newConversionAdjustment("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionAdjustmentRequiredDescriptionRule flags a blank description", () => {
  const rule = new ConversionAdjustmentRequiredDescriptionRule("conversion adjustment needs an entry");
  const item = newConversionAdjustment("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionAdjustmentBidRangeRule flags values above bid", () => {
  const rule = new ConversionAdjustmentBidRangeRule(2.5, 3900.7);
  const item = newConversionAdjustment("x", "y");
  item.bid = 3902.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionAdjustmentSequenceRangeRule flags values above sequence", () => {
  const rule = new ConversionAdjustmentSequenceRangeRule(80, 1000);
  const item = newConversionAdjustment("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionAdjustmentBudgetRangeRule flags values above budget", () => {
  const rule = new ConversionAdjustmentBudgetRangeRule(9.6, 2910.8);
  const item = newConversionAdjustment("x", "y");
  item.budget = 2912.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
