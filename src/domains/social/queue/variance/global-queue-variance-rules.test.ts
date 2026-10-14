import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalQueueVarianceContactEmailLengthRule,
  GlobalQueueVarianceFrequencyCapRangeRule,
  GlobalQueueVarianceGraceDaysRangeRule,
  GlobalQueueVarianceMaximumRangeRule,
  GlobalQueueVarianceRequiredCodeRule,
  defaultGlobalQueueVarianceValidator,
} from "./global-queue-variance-rules.js";
import { newGlobalQueueVariance } from "./global-queue-variance.js";

test("GlobalQueueVarianceValidator reports every problem", () => {
  const validator = defaultGlobalQueueVarianceValidator();
  const item = newGlobalQueueVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalQueueVarianceGraceDaysRangeRule flags values above grace days", () => {
  const rule = new GlobalQueueVarianceGraceDaysRangeRule(32, 86400);
  const item = newGlobalQueueVariance("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalQueueVarianceContactEmailLengthRule flags a long contact email", () => {
  const rule = new GlobalQueueVarianceContactEmailLengthRule(86400);
  const item = newGlobalQueueVariance("x", "y");
  item.contactEmail = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalQueueVarianceFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new GlobalQueueVarianceFrequencyCapRangeRule(16, 255);
  const item = newGlobalQueueVariance("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalQueueVarianceMaximumRangeRule flags values above maximum", () => {
  const rule = new GlobalQueueVarianceMaximumRangeRule(2.6, 4489.8);
  const item = newGlobalQueueVariance("x", "y");
  item.maximum = 4491.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalQueueVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalQueueVarianceRequiredCodeRule("global queue variance needs an entry");
  const item = newGlobalQueueVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
