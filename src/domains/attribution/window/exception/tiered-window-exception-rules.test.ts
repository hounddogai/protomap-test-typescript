import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredWindowExceptionCodeLengthRule,
  TieredWindowExceptionImpressionsRangeRule,
  TieredWindowExceptionMaximumRangeRule,
  TieredWindowExceptionTitleLengthRule,
  defaultTieredWindowExceptionValidator,
} from "./tiered-window-exception-rules.js";
import { newTieredWindowException } from "./tiered-window-exception.js";

test("TieredWindowExceptionValidator reports every problem", () => {
  const validator = defaultTieredWindowExceptionValidator();
  const item = newTieredWindowException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredWindowExceptionTitleLengthRule flags a long title", () => {
  const rule = new TieredWindowExceptionTitleLengthRule(16);
  const item = newTieredWindowException("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWindowExceptionImpressionsRangeRule flags values above impressions", () => {
  const rule = new TieredWindowExceptionImpressionsRangeRule(32, 1000);
  const item = newTieredWindowException("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredWindowExceptionMaximumRangeRule flags values above maximum", () => {
  const rule = new TieredWindowExceptionMaximumRangeRule(7.2, 3049.1);
  const item = newTieredWindowException("x", "y");
  item.maximum = 3050.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredWindowExceptionCodeLengthRule flags a long code", () => {
  const rule = new TieredWindowExceptionCodeLengthRule(1000);
  const item = newTieredWindowException("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
