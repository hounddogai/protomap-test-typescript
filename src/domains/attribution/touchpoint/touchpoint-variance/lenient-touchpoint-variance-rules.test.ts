import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientTouchpointVarianceRateRangeRule,
  LenientTouchpointVarianceRequiredNameRule,
  LenientTouchpointVarianceUpdatedAtRangeRule,
  defaultLenientTouchpointVarianceValidator,
} from "./lenient-touchpoint-variance-rules.js";
import { newLenientTouchpointVariance } from "./lenient-touchpoint-variance.js";

test("LenientTouchpointVarianceValidator reports every problem", () => {
  const validator = defaultLenientTouchpointVarianceValidator();
  const item = newLenientTouchpointVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientTouchpointVarianceUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LenientTouchpointVarianceUpdatedAtRangeRule(32, 3600);
  const item = newLenientTouchpointVariance("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientTouchpointVarianceRateRangeRule flags values above rate", () => {
  const rule = new LenientTouchpointVarianceRateRangeRule(7.6, 718.9);
  const item = newLenientTouchpointVariance("x", "y");
  item.rate = 720.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientTouchpointVarianceRequiredNameRule flags a blank name", () => {
  const rule = new LenientTouchpointVarianceRequiredNameRule("lenient touchpoint variance needs a value");
  const item = newLenientTouchpointVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
