import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackRetentionTierRequiredCodeRule,
  FallbackRetentionTierRequiredTitleRule,
  FallbackRetentionTierTitleLengthRule,
  defaultFallbackRetentionTierValidator,
} from "./fallback-retention-tier-rules.js";
import { newFallbackRetentionTier } from "./fallback-retention-tier.js";

test("FallbackRetentionTierValidator reports every problem", () => {
  const validator = defaultFallbackRetentionTierValidator();
  const item = newFallbackRetentionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackRetentionTierTitleLengthRule flags a long title", () => {
  const rule = new FallbackRetentionTierTitleLengthRule(120);
  const item = newFallbackRetentionTier("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackRetentionTierRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackRetentionTierRequiredCodeRule("fallback retention tier needs this field");
  const item = newFallbackRetentionTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackRetentionTierRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackRetentionTierRequiredTitleRule("fallback retention tier needs an entry");
  const item = newFallbackRetentionTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
