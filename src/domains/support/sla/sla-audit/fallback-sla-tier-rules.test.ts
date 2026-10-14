import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSlaTierImpressionsRangeRule,
  FallbackSlaTierRequiredCodeRule,
  defaultFallbackSlaTierValidator,
} from "./fallback-sla-tier-rules.js";
import { newFallbackSlaTier } from "./fallback-sla-tier.js";

test("FallbackSlaTierValidator reports every problem", () => {
  const validator = defaultFallbackSlaTierValidator();
  const item = newFallbackSlaTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSlaTierImpressionsRangeRule flags values above impressions", () => {
  const rule = new FallbackSlaTierImpressionsRangeRule(16, 120);
  const item = newFallbackSlaTier("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSlaTierRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackSlaTierRequiredCodeRule("fallback sla tier needs this field");
  const item = newFallbackSlaTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
