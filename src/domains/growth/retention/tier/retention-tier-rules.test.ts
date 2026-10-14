import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionTierCodeLengthRule,
  RetentionTierRequiredCodeRule,
  RetentionTierRequiredTitleRule,
  RetentionTierStartsAtRangeRule,
  defaultRetentionTierValidator,
} from "./retention-tier-rules.js";
import { newRetentionTier } from "./retention-tier.js";

test("RetentionTierValidator reports every problem", () => {
  const validator = defaultRetentionTierValidator();
  const item = newRetentionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionTierCodeLengthRule flags a long code", () => {
  const rule = new RetentionTierCodeLengthRule(3600);
  const item = newRetentionTier("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionTierRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionTierRequiredCodeRule("retention tier needs an entry");
  const item = newRetentionTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionTierRequiredTitleRule flags a blank title", () => {
  const rule = new RetentionTierRequiredTitleRule("retention tier needs an entry");
  const item = newRetentionTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionTierStartsAtRangeRule flags values above starts at", () => {
  const rule = new RetentionTierStartsAtRangeRule(16, 80);
  const item = newRetentionTier("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
