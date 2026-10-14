import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPayoutOverrideVariantLengthRule,
  defaultFallbackPayoutOverrideValidator,
} from "./fallback-payout-override-rules.js";
import { newFallbackPayoutOverride } from "./fallback-payout-override.js";

test("FallbackPayoutOverrideValidator reports every problem", () => {
  const validator = defaultFallbackPayoutOverrideValidator();
  const item = newFallbackPayoutOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPayoutOverrideVariantLengthRule flags a long variant", () => {
  const rule = new FallbackPayoutOverrideVariantLengthRule(120);
  const item = newFallbackPayoutOverride("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
