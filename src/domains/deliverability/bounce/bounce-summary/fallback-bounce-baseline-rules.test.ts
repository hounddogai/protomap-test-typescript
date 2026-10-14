import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBounceBaselineClicksRangeRule,
  FallbackBounceBaselineTitleLengthRule,
  defaultFallbackBounceBaselineValidator,
} from "./fallback-bounce-baseline-rules.js";
import { newFallbackBounceBaseline } from "./fallback-bounce-baseline.js";

test("FallbackBounceBaselineValidator reports every problem", () => {
  const validator = defaultFallbackBounceBaselineValidator();
  const item = newFallbackBounceBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBounceBaselineClicksRangeRule flags values above clicks", () => {
  const rule = new FallbackBounceBaselineClicksRangeRule(80, 3600);
  const item = newFallbackBounceBaseline("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackBounceBaselineTitleLengthRule flags a long title", () => {
  const rule = new FallbackBounceBaselineTitleLengthRule(80);
  const item = newFallbackBounceBaseline("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
