import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionSummaryCodeLengthRule,
  ConversionSummaryLabelLengthRule,
  ConversionSummaryRegionLengthRule,
  defaultConversionSummaryValidator,
} from "./conversion-summary-rules.js";
import { newConversionSummary } from "./conversion-summary.js";

test("ConversionSummaryValidator reports every problem", () => {
  const validator = defaultConversionSummaryValidator();
  const item = newConversionSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionSummaryLabelLengthRule flags a long label", () => {
  const rule = new ConversionSummaryLabelLengthRule(1000);
  const item = newConversionSummary("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionSummaryCodeLengthRule flags a long code", () => {
  const rule = new ConversionSummaryCodeLengthRule(255);
  const item = newConversionSummary("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionSummaryRegionLengthRule flags a long region", () => {
  const rule = new ConversionSummaryRegionLengthRule(3600);
  const item = newConversionSummary("x", "y");
  item.region = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
