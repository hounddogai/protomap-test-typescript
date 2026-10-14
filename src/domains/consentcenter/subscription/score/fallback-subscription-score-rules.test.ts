import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSubscriptionScoreCodeLengthRule,
  FallbackSubscriptionScoreContactEmailLengthRule,
  FallbackSubscriptionScoreRatioRangeRule,
  FallbackSubscriptionScoreRequiredCodeRule,
  defaultFallbackSubscriptionScoreValidator,
} from "./fallback-subscription-score-rules.js";
import { newFallbackSubscriptionScore } from "./fallback-subscription-score.js";

test("FallbackSubscriptionScoreValidator reports every problem", () => {
  const validator = defaultFallbackSubscriptionScoreValidator();
  const item = newFallbackSubscriptionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSubscriptionScoreRatioRangeRule flags values above ratio", () => {
  const rule = new FallbackSubscriptionScoreRatioRangeRule(9.3, 637.4);
  const item = newFallbackSubscriptionScore("x", "y");
  item.ratio = 638.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSubscriptionScoreCodeLengthRule flags a long code", () => {
  const rule = new FallbackSubscriptionScoreCodeLengthRule(120);
  const item = newFallbackSubscriptionScore("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSubscriptionScoreContactEmailLengthRule flags a long contact email", () => {
  const rule = new FallbackSubscriptionScoreContactEmailLengthRule(64);
  const item = newFallbackSubscriptionScore("x", "y");
  item.contactEmail = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSubscriptionScoreRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackSubscriptionScoreRequiredCodeRule("fallback subscription score needs an entry");
  const item = newFallbackSubscriptionScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
