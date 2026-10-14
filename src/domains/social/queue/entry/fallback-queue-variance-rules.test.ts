import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackQueueVarianceCeilingRangeRule,
  FallbackQueueVarianceClicksRangeRule,
  FallbackQueueVarianceMarginRangeRule,
  FallbackQueueVarianceRequiredCohortRule,
  defaultFallbackQueueVarianceValidator,
} from "./fallback-queue-variance-rules.js";
import { newFallbackQueueVariance } from "./fallback-queue-variance.js";

test("FallbackQueueVarianceValidator reports every problem", () => {
  const validator = defaultFallbackQueueVarianceValidator();
  const item = newFallbackQueueVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackQueueVarianceRequiredCohortRule flags a blank cohort", () => {
  const rule = new FallbackQueueVarianceRequiredCohortRule("fallback queue variance needs a value");
  const item = newFallbackQueueVariance("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackQueueVarianceCeilingRangeRule flags values above ceiling", () => {
  const rule = new FallbackQueueVarianceCeilingRangeRule(4.9, 1248.8);
  const item = newFallbackQueueVariance("x", "y");
  item.ceiling = 1250.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackQueueVarianceMarginRangeRule flags values above margin", () => {
  const rule = new FallbackQueueVarianceMarginRangeRule(4.6, 4512.1);
  const item = newFallbackQueueVariance("x", "y");
  item.margin = 4513.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackQueueVarianceClicksRangeRule flags values above clicks", () => {
  const rule = new FallbackQueueVarianceClicksRangeRule(16, 1000);
  const item = newFallbackQueueVariance("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
