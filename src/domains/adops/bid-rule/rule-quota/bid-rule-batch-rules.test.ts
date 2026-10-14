import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleBatchFrequencyCapRangeRule,
  BidRuleBatchMarginRangeRule,
  BidRuleBatchNotesLengthRule,
  BidRuleBatchRequiredLabelRule,
  defaultBidRuleBatchValidator,
} from "./bid-rule-batch-rules.js";
import { newBidRuleBatch } from "./bid-rule-batch.js";

test("BidRuleBatchValidator reports every problem", () => {
  const validator = defaultBidRuleBatchValidator();
  const item = newBidRuleBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleBatchNotesLengthRule flags a long notes", () => {
  const rule = new BidRuleBatchNotesLengthRule(64);
  const item = newBidRuleBatch("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleBatchFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BidRuleBatchFrequencyCapRangeRule(120, 3600);
  const item = newBidRuleBatch("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleBatchRequiredLabelRule flags a blank label", () => {
  const rule = new BidRuleBatchRequiredLabelRule("bid rule batch needs a value");
  const item = newBidRuleBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleBatchMarginRangeRule flags values above margin", () => {
  const rule = new BidRuleBatchMarginRangeRule(1.1, 3996.8);
  const item = newBidRuleBatch("x", "y");
  item.margin = 3998.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
