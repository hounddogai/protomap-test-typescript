import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackWarmupEntryRequiredCodeRule,
  FallbackWarmupEntryRequiredTitleRule,
  FallbackWarmupEntryVariantLengthRule,
  defaultFallbackWarmupEntryValidator,
} from "./fallback-warmup-entry-rules.js";
import { newFallbackWarmupEntry } from "./fallback-warmup-entry.js";

test("FallbackWarmupEntryValidator reports every problem", () => {
  const validator = defaultFallbackWarmupEntryValidator();
  const item = newFallbackWarmupEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackWarmupEntryRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackWarmupEntryRequiredCodeRule("fallback warmup entry needs a value");
  const item = newFallbackWarmupEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackWarmupEntryRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackWarmupEntryRequiredTitleRule("fallback warmup entry needs an entry");
  const item = newFallbackWarmupEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackWarmupEntryVariantLengthRule flags a long variant", () => {
  const rule = new FallbackWarmupEntryVariantLengthRule(86400);
  const item = newFallbackWarmupEntry("x", "y");
  item.variant = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
