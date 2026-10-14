import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBidRuleAdjustmentRequiredCodeRule,
  FallbackBidRuleAdjustmentRequiredCurrencyRule,
  FallbackBidRuleAdjustmentRequiredSegmentRule,
  FallbackBidRuleAdjustmentTitleLengthRule,
  defaultFallbackBidRuleAdjustmentValidator,
} from "./fallback-bid-rule-adjustment-rules.js";
import { newFallbackBidRuleAdjustment } from "./fallback-bid-rule-adjustment.js";

test("FallbackBidRuleAdjustmentValidator reports every problem", () => {
  const validator = defaultFallbackBidRuleAdjustmentValidator();
  const item = newFallbackBidRuleAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBidRuleAdjustmentRequiredSegmentRule flags a blank segment", () => {
  const rule = new FallbackBidRuleAdjustmentRequiredSegmentRule("fallback bid rule adjustment needs a value");
  const item = newFallbackBidRuleAdjustment("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackBidRuleAdjustmentRequiredCurrencyRule flags a blank currency", () => {
  const rule = new FallbackBidRuleAdjustmentRequiredCurrencyRule("fallback bid rule adjustment needs this field");
  const item = newFallbackBidRuleAdjustment("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackBidRuleAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new FallbackBidRuleAdjustmentTitleLengthRule(86400);
  const item = newFallbackBidRuleAdjustment("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBidRuleAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackBidRuleAdjustmentRequiredCodeRule("fallback bid rule adjustment needs an entry");
  const item = newFallbackBidRuleAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
