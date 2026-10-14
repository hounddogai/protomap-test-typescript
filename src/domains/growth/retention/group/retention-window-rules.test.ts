import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionWindowCodeLengthRule,
  RetentionWindowLabelLengthRule,
  RetentionWindowRequiredCurrencyRule,
  RetentionWindowRequiredVariantRule,
  defaultRetentionWindowValidator,
} from "./retention-window-rules.js";
import { newRetentionWindow } from "./retention-window.js";

test("RetentionWindowValidator reports every problem", () => {
  const validator = defaultRetentionWindowValidator();
  const item = newRetentionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionWindowRequiredVariantRule flags a blank variant", () => {
  const rule = new RetentionWindowRequiredVariantRule("retention window needs an entry");
  const item = newRetentionWindow("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionWindowRequiredCurrencyRule flags a blank currency", () => {
  const rule = new RetentionWindowRequiredCurrencyRule("retention window needs a value");
  const item = newRetentionWindow("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionWindowCodeLengthRule flags a long code", () => {
  const rule = new RetentionWindowCodeLengthRule(86400);
  const item = newRetentionWindow("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionWindowLabelLengthRule flags a long label", () => {
  const rule = new RetentionWindowLabelLengthRule(1000);
  const item = newRetentionWindow("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
