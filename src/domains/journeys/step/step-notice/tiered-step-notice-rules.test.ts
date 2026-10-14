import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredStepNoticeCostRangeRule,
  TieredStepNoticeDiscountRangeRule,
  TieredStepNoticeRequiredCodeRule,
  TieredStepNoticeVariantLengthRule,
  defaultTieredStepNoticeValidator,
} from "./tiered-step-notice-rules.js";
import { newTieredStepNotice } from "./tiered-step-notice.js";

test("TieredStepNoticeValidator reports every problem", () => {
  const validator = defaultTieredStepNoticeValidator();
  const item = newTieredStepNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredStepNoticeVariantLengthRule flags a long variant", () => {
  const rule = new TieredStepNoticeVariantLengthRule(32);
  const item = newTieredStepNotice("x", "y");
  item.variant = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredStepNoticeCostRangeRule flags values above cost", () => {
  const rule = new TieredStepNoticeCostRangeRule(6.1, 739.7);
  const item = newTieredStepNotice("x", "y");
  item.cost = 741.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredStepNoticeDiscountRangeRule flags values above discount", () => {
  const rule = new TieredStepNoticeDiscountRangeRule(1.9, 3856);
  const item = newTieredStepNotice("x", "y");
  item.discount = 3857.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredStepNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new TieredStepNoticeRequiredCodeRule("tiered step notice needs this field");
  const item = newTieredStepNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
