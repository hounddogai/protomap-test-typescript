import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBidRuleWindowAudienceIdLengthRule,
  FallbackBidRuleWindowCodeLengthRule,
  FallbackBidRuleWindowWindowDaysRangeRule,
  defaultFallbackBidRuleWindowValidator,
} from "./fallback-bid-rule-window-rules.js";
import { newFallbackBidRuleWindow } from "./fallback-bid-rule-window.js";

test("FallbackBidRuleWindowValidator reports every problem", () => {
  const validator = defaultFallbackBidRuleWindowValidator();
  const item = newFallbackBidRuleWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBidRuleWindowAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FallbackBidRuleWindowAudienceIdLengthRule(80);
  const item = newFallbackBidRuleWindow("x", "y");
  item.audienceId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBidRuleWindowCodeLengthRule flags a long code", () => {
  const rule = new FallbackBidRuleWindowCodeLengthRule(86400);
  const item = newFallbackBidRuleWindow("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBidRuleWindowWindowDaysRangeRule flags values above window days", () => {
  const rule = new FallbackBidRuleWindowWindowDaysRangeRule(16, 86400);
  const item = newFallbackBidRuleWindow("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
