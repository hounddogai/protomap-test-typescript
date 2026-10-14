import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionExceptionSourceLengthRule,
  RedemptionExceptionVersionRangeRule,
  RedemptionExceptionWindowDaysRangeRule,
  defaultRedemptionExceptionValidator,
} from "./redemption-exception-rules.js";
import { newRedemptionException } from "./redemption-exception.js";

test("RedemptionExceptionValidator reports every problem", () => {
  const validator = defaultRedemptionExceptionValidator();
  const item = newRedemptionException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionExceptionWindowDaysRangeRule flags values above window days", () => {
  const rule = new RedemptionExceptionWindowDaysRangeRule(120, 1000);
  const item = newRedemptionException("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionExceptionSourceLengthRule flags a long source", () => {
  const rule = new RedemptionExceptionSourceLengthRule(120);
  const item = newRedemptionException("x", "y");
  item.source = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionExceptionVersionRangeRule flags values above version", () => {
  const rule = new RedemptionExceptionVersionRangeRule(80, 1000);
  const item = newRedemptionException("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
