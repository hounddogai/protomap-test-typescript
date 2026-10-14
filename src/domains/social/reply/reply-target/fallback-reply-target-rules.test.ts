import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackReplyTargetRequiredCohortRule,
  FallbackReplyTargetRequiredTitleRule,
  FallbackReplyTargetScoreRangeRule,
  FallbackReplyTargetTitleLengthRule,
  defaultFallbackReplyTargetValidator,
} from "./fallback-reply-target-rules.js";
import { newFallbackReplyTarget } from "./fallback-reply-target.js";

test("FallbackReplyTargetValidator reports every problem", () => {
  const validator = defaultFallbackReplyTargetValidator();
  const item = newFallbackReplyTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackReplyTargetScoreRangeRule flags values above score", () => {
  const rule = new FallbackReplyTargetScoreRangeRule(8.4, 661);
  const item = newFallbackReplyTarget("x", "y");
  item.score = 662.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackReplyTargetRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackReplyTargetRequiredTitleRule("fallback reply target needs this field");
  const item = newFallbackReplyTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackReplyTargetTitleLengthRule flags a long title", () => {
  const rule = new FallbackReplyTargetTitleLengthRule(120);
  const item = newFallbackReplyTarget("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackReplyTargetRequiredCohortRule flags a blank cohort", () => {
  const rule = new FallbackReplyTargetRequiredCohortRule("fallback reply target needs an entry");
  const item = newFallbackReplyTarget("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
