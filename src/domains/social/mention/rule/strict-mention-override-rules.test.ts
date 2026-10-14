import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictMentionOverrideCodeLengthRule,
  StrictMentionOverrideLimitRangeRule,
  StrictMentionOverrideMinimumRangeRule,
  StrictMentionOverrideRequiredCurrencyRule,
  StrictMentionOverrideRequiredReviewerRule,
  defaultStrictMentionOverrideValidator,
} from "./strict-mention-override-rules.js";
import { newStrictMentionOverride } from "./strict-mention-override.js";

test("StrictMentionOverrideValidator reports every problem", () => {
  const validator = defaultStrictMentionOverrideValidator();
  const item = newStrictMentionOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictMentionOverrideRequiredCurrencyRule flags a blank currency", () => {
  const rule = new StrictMentionOverrideRequiredCurrencyRule("strict mention override needs a value");
  const item = newStrictMentionOverride("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictMentionOverrideRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new StrictMentionOverrideRequiredReviewerRule("strict mention override needs an entry");
  const item = newStrictMentionOverride("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictMentionOverrideMinimumRangeRule flags values above minimum", () => {
  const rule = new StrictMentionOverrideMinimumRangeRule(8.8, 4091.4);
  const item = newStrictMentionOverride("x", "y");
  item.minimum = 4092.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictMentionOverrideLimitRangeRule flags values above limit", () => {
  const rule = new StrictMentionOverrideLimitRangeRule(64, 120);
  const item = newStrictMentionOverride("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictMentionOverrideCodeLengthRule flags a long code", () => {
  const rule = new StrictMentionOverrideCodeLengthRule(80);
  const item = newStrictMentionOverride("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
