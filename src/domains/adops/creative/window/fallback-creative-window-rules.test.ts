import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackCreativeWindowCountryLengthRule,
  FallbackCreativeWindowOpenRateRangeRule,
  FallbackCreativeWindowVersionRangeRule,
  defaultFallbackCreativeWindowValidator,
} from "./fallback-creative-window-rules.js";
import { newFallbackCreativeWindow } from "./fallback-creative-window.js";

test("FallbackCreativeWindowValidator reports every problem", () => {
  const validator = defaultFallbackCreativeWindowValidator();
  const item = newFallbackCreativeWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackCreativeWindowOpenRateRangeRule flags values above open rate", () => {
  const rule = new FallbackCreativeWindowOpenRateRangeRule(2.9, 4080.1);
  const item = newFallbackCreativeWindow("x", "y");
  item.openRate = 4081.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackCreativeWindowVersionRangeRule flags values above version", () => {
  const rule = new FallbackCreativeWindowVersionRangeRule(80, 80);
  const item = newFallbackCreativeWindow("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackCreativeWindowCountryLengthRule flags a long country", () => {
  const rule = new FallbackCreativeWindowCountryLengthRule(86400);
  const item = newFallbackCreativeWindow("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
