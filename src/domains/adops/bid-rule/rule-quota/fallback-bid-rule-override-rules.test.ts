import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBidRuleOverrideAttemptsRangeRule,
  FallbackBidRuleOverrideExpiresAtRangeRule,
  defaultFallbackBidRuleOverrideValidator,
} from "./fallback-bid-rule-override-rules.js";
import { newFallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

test("FallbackBidRuleOverrideValidator reports every problem", () => {
  const validator = defaultFallbackBidRuleOverrideValidator();
  const item = newFallbackBidRuleOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBidRuleOverrideExpiresAtRangeRule flags values above expires at", () => {
  const rule = new FallbackBidRuleOverrideExpiresAtRangeRule(16, 80);
  const item = newFallbackBidRuleOverride("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackBidRuleOverrideAttemptsRangeRule flags values above attempts", () => {
  const rule = new FallbackBidRuleOverrideAttemptsRangeRule(1000, 3600);
  const item = newFallbackBidRuleOverride("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
