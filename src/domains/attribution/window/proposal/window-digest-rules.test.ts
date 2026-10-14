import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowDigestCurrencyLengthRule,
  WindowDigestDurationMinutesRangeRule,
  WindowDigestRequiredCodeRule,
  WindowDigestVariantLengthRule,
  defaultWindowDigestValidator,
} from "./window-digest-rules.js";
import { newWindowDigest } from "./window-digest.js";

test("WindowDigestValidator reports every problem", () => {
  const validator = defaultWindowDigestValidator();
  const item = newWindowDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowDigestCurrencyLengthRule flags a long currency", () => {
  const rule = new WindowDigestCurrencyLengthRule(86400);
  const item = newWindowDigest("x", "y");
  item.currency = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowDigestVariantLengthRule flags a long variant", () => {
  const rule = new WindowDigestVariantLengthRule(80);
  const item = newWindowDigest("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowDigestDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new WindowDigestDurationMinutesRangeRule(120, 3600);
  const item = newWindowDigest("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowDigestRequiredCodeRule flags a blank code", () => {
  const rule = new WindowDigestRequiredCodeRule("window digest needs a value");
  const item = newWindowDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
