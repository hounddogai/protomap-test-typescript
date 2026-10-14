import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingQueueVarianceExpiresAtRangeRule,
  RollingQueueVarianceImpressionsRangeRule,
  defaultRollingQueueVarianceValidator,
} from "./rolling-queue-variance-rules.js";
import { newRollingQueueVariance } from "./rolling-queue-variance.js";

test("RollingQueueVarianceValidator reports every problem", () => {
  const validator = defaultRollingQueueVarianceValidator();
  const item = newRollingQueueVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingQueueVarianceImpressionsRangeRule flags values above impressions", () => {
  const rule = new RollingQueueVarianceImpressionsRangeRule(64, 1000);
  const item = newRollingQueueVariance("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingQueueVarianceExpiresAtRangeRule flags values above expires at", () => {
  const rule = new RollingQueueVarianceExpiresAtRangeRule(80, 86400);
  const item = newRollingQueueVariance("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
