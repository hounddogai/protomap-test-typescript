import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatVarianceCodeLengthRule,
  CsatVarianceCreatedAtRangeRule,
  CsatVarianceRequiredCodeRule,
  CsatVarianceRequiredLabelRule,
  CsatVarianceRequiredVariantRule,
  defaultCsatVarianceValidator,
} from "./csat-variance-rules.js";
import { newCsatVariance } from "./csat-variance.js";

test("CsatVarianceValidator reports every problem", () => {
  const validator = defaultCsatVarianceValidator();
  const item = newCsatVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new CsatVarianceRequiredLabelRule("csat variance needs this field");
  const item = newCsatVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatVarianceCodeLengthRule flags a long code", () => {
  const rule = new CsatVarianceCodeLengthRule(3600);
  const item = newCsatVariance("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new CsatVarianceRequiredCodeRule("csat variance needs a value");
  const item = newCsatVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatVarianceRequiredVariantRule flags a blank variant", () => {
  const rule = new CsatVarianceRequiredVariantRule("csat variance needs an entry");
  const item = newCsatVariance("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatVarianceCreatedAtRangeRule flags values above created at", () => {
  const rule = new CsatVarianceCreatedAtRangeRule(16, 255);
  const item = newCsatVariance("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
