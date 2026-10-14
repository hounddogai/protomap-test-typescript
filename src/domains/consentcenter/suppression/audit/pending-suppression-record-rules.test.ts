import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSuppressionRecordCategoryLengthRule,
  PendingSuppressionRecordConversionRateRangeRule,
  PendingSuppressionRecordRateRangeRule,
  PendingSuppressionRecordRequiredCohortRule,
  PendingSuppressionRecordStartsAtRangeRule,
  defaultPendingSuppressionRecordValidator,
} from "./pending-suppression-record-rules.js";
import { newPendingSuppressionRecord } from "./pending-suppression-record.js";

test("PendingSuppressionRecordValidator reports every problem", () => {
  const validator = defaultPendingSuppressionRecordValidator();
  const item = newPendingSuppressionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSuppressionRecordConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PendingSuppressionRecordConversionRateRangeRule(1.7, 2346.9);
  const item = newPendingSuppressionRecord("x", "y");
  item.conversionRate = 2348.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSuppressionRecordCategoryLengthRule flags a long category", () => {
  const rule = new PendingSuppressionRecordCategoryLengthRule(120);
  const item = newPendingSuppressionRecord("x", "y");
  item.category = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingSuppressionRecordRateRangeRule flags values above rate", () => {
  const rule = new PendingSuppressionRecordRateRangeRule(6.7, 889.8);
  const item = newPendingSuppressionRecord("x", "y");
  item.rate = 891.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSuppressionRecordRequiredCohortRule flags a blank cohort", () => {
  const rule = new PendingSuppressionRecordRequiredCohortRule("pending suppression record needs an entry");
  const item = newPendingSuppressionRecord("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSuppressionRecordStartsAtRangeRule flags values above starts at", () => {
  const rule = new PendingSuppressionRecordStartsAtRangeRule(80, 120);
  const item = newPendingSuppressionRecord("x", "y");
  item.startsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
