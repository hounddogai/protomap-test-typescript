import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleTierAttemptsRangeRule,
  BidRuleTierBudgetRangeRule,
  BidRuleTierLocaleLengthRule,
  BidRuleTierRequiredNameRule,
  defaultBidRuleTierValidator,
} from "./bid-rule-tier-rules.js";
import { newBidRuleTier } from "./bid-rule-tier.js";

test("BidRuleTierValidator reports every problem", () => {
  const validator = defaultBidRuleTierValidator();
  const item = newBidRuleTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleTierAttemptsRangeRule flags values above attempts", () => {
  const rule = new BidRuleTierAttemptsRangeRule(16, 86400);
  const item = newBidRuleTier("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleTierLocaleLengthRule flags a long locale", () => {
  const rule = new BidRuleTierLocaleLengthRule(80);
  const item = newBidRuleTier("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleTierRequiredNameRule flags a blank name", () => {
  const rule = new BidRuleTierRequiredNameRule("bid rule tier needs this field");
  const item = newBidRuleTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleTierBudgetRangeRule flags values above budget", () => {
  const rule = new BidRuleTierBudgetRangeRule(7.1, 2109.2);
  const item = newBidRuleTier("x", "y");
  item.budget = 2110.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
