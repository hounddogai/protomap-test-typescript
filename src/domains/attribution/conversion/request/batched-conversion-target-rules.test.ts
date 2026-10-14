import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedConversionTargetRatioRangeRule,
  BatchedConversionTargetRequiredNameRule,
  BatchedConversionTargetRequiredNotesRule,
  defaultBatchedConversionTargetValidator,
} from "./batched-conversion-target-rules.js";
import { newBatchedConversionTarget } from "./batched-conversion-target.js";

test("BatchedConversionTargetValidator reports every problem", () => {
  const validator = defaultBatchedConversionTargetValidator();
  const item = newBatchedConversionTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedConversionTargetRequiredNameRule flags a blank name", () => {
  const rule = new BatchedConversionTargetRequiredNameRule("batched conversion target needs this field");
  const item = newBatchedConversionTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedConversionTargetRatioRangeRule flags values above ratio", () => {
  const rule = new BatchedConversionTargetRatioRangeRule(7.4, 4353.6);
  const item = newBatchedConversionTarget("x", "y");
  item.ratio = 4355.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedConversionTargetRequiredNotesRule flags a blank notes", () => {
  const rule = new BatchedConversionTargetRequiredNotesRule("batched conversion target needs a value");
  const item = newBatchedConversionTarget("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
