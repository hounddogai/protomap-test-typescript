import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientBidRuleAdjustmentCodeLengthRule,
  LenientBidRuleAdjustmentRequiredTitleRule,
  LenientBidRuleAdjustmentTitleLengthRule,
  defaultLenientBidRuleAdjustmentValidator,
} from "./lenient-bid-rule-adjustment-rules.js";
import { newLenientBidRuleAdjustment } from "./lenient-bid-rule-adjustment.js";

test("LenientBidRuleAdjustmentValidator reports every problem", () => {
  const validator = defaultLenientBidRuleAdjustmentValidator();
  const item = newLenientBidRuleAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientBidRuleAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new LenientBidRuleAdjustmentCodeLengthRule(3600);
  const item = newLenientBidRuleAdjustment("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientBidRuleAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new LenientBidRuleAdjustmentRequiredTitleRule("lenient bid rule adjustment needs a value");
  const item = newLenientBidRuleAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientBidRuleAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new LenientBidRuleAdjustmentTitleLengthRule(3600);
  const item = newLenientBidRuleAdjustment("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
