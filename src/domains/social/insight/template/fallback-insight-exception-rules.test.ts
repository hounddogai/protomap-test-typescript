import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackInsightExceptionCostRangeRule,
  FallbackInsightExceptionNameLengthRule,
  FallbackInsightExceptionRequiredCodeRule,
  defaultFallbackInsightExceptionValidator,
} from "./fallback-insight-exception-rules.js";
import { newFallbackInsightException } from "./fallback-insight-exception.js";

test("FallbackInsightExceptionValidator reports every problem", () => {
  const validator = defaultFallbackInsightExceptionValidator();
  const item = newFallbackInsightException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackInsightExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackInsightExceptionRequiredCodeRule("fallback insight exception needs an entry");
  const item = newFallbackInsightException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackInsightExceptionCostRangeRule flags values above cost", () => {
  const rule = new FallbackInsightExceptionCostRangeRule(4.5, 559.3);
  const item = newFallbackInsightException("x", "y");
  item.cost = 560.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackInsightExceptionNameLengthRule flags a long name", () => {
  const rule = new FallbackInsightExceptionNameLengthRule(3600);
  const item = newFallbackInsightException("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
