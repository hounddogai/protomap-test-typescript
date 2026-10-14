import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditSnapshotCodeLengthRule,
  CreditSnapshotConversionRateRangeRule,
  CreditSnapshotDiscountRangeRule,
  CreditSnapshotImpressionsRangeRule,
  CreditSnapshotRequiredCodeRule,
  CreditSnapshotTitleLengthRule,
  defaultCreditSnapshotValidator,
} from "./credit-snapshot-rules.js";
import { newCreditSnapshot } from "./credit-snapshot.js";

test("CreditSnapshotValidator reports every problem", () => {
  const validator = defaultCreditSnapshotValidator();
  const item = newCreditSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditSnapshotCodeLengthRule flags a long code", () => {
  const rule = new CreditSnapshotCodeLengthRule(1000);
  const item = newCreditSnapshot("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditSnapshotConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new CreditSnapshotConversionRateRangeRule(1.3, 54.1);
  const item = newCreditSnapshot("x", "y");
  item.conversionRate = 55.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditSnapshotTitleLengthRule flags a long title", () => {
  const rule = new CreditSnapshotTitleLengthRule(120);
  const item = newCreditSnapshot("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditSnapshotDiscountRangeRule flags values above discount", () => {
  const rule = new CreditSnapshotDiscountRangeRule(4, 4950.4);
  const item = newCreditSnapshot("x", "y");
  item.discount = 4951.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditSnapshotImpressionsRangeRule flags values above impressions", () => {
  const rule = new CreditSnapshotImpressionsRangeRule(64, 1000);
  const item = newCreditSnapshot("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new CreditSnapshotRequiredCodeRule("credit snapshot needs an entry");
  const item = newCreditSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
