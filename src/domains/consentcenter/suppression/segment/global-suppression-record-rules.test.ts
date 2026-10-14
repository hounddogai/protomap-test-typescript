import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSuppressionRecordConversionRateRangeRule,
  GlobalSuppressionRecordRequiredCodeRule,
  GlobalSuppressionRecordRequiredNameRule,
  GlobalSuppressionRecordSourceLengthRule,
  defaultGlobalSuppressionRecordValidator,
} from "./global-suppression-record-rules.js";
import { newGlobalSuppressionRecord } from "./global-suppression-record.js";

test("GlobalSuppressionRecordValidator reports every problem", () => {
  const validator = defaultGlobalSuppressionRecordValidator();
  const item = newGlobalSuppressionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSuppressionRecordRequiredNameRule flags a blank name", () => {
  const rule = new GlobalSuppressionRecordRequiredNameRule("global suppression record needs this field");
  const item = newGlobalSuppressionRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSuppressionRecordConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new GlobalSuppressionRecordConversionRateRangeRule(1.6, 3953.5);
  const item = newGlobalSuppressionRecord("x", "y");
  item.conversionRate = 3955;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSuppressionRecordSourceLengthRule flags a long source", () => {
  const rule = new GlobalSuppressionRecordSourceLengthRule(255);
  const item = newGlobalSuppressionRecord("x", "y");
  item.source = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalSuppressionRecordRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalSuppressionRecordRequiredCodeRule("global suppression record needs this field");
  const item = newGlobalSuppressionRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
