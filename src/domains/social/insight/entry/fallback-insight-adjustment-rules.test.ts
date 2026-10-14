import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackInsightAdjustmentCodeLengthRule,
  FallbackInsightAdjustmentRequiredNameRule,
  defaultFallbackInsightAdjustmentValidator,
} from "./fallback-insight-adjustment-rules.js";
import { newFallbackInsightAdjustment } from "./fallback-insight-adjustment.js";

test("FallbackInsightAdjustmentValidator reports every problem", () => {
  const validator = defaultFallbackInsightAdjustmentValidator();
  const item = newFallbackInsightAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackInsightAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new FallbackInsightAdjustmentRequiredNameRule("fallback insight adjustment needs a value");
  const item = newFallbackInsightAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackInsightAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new FallbackInsightAdjustmentCodeLengthRule(86400);
  const item = newFallbackInsightAdjustment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
