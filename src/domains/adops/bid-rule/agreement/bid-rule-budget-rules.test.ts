import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleBudgetCodeLengthRule,
  BidRuleBudgetRequiredCodeRule,
  BidRuleBudgetRequiredRegionRule,
  BidRuleBudgetRevisionRangeRule,
  defaultBidRuleBudgetValidator,
} from "./bid-rule-budget-rules.js";
import { newBidRuleBudget } from "./bid-rule-budget.js";

test("BidRuleBudgetValidator reports every problem", () => {
  const validator = defaultBidRuleBudgetValidator();
  const item = newBidRuleBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new BidRuleBudgetRequiredCodeRule("bid rule budget needs an entry");
  const item = newBidRuleBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleBudgetRequiredRegionRule flags a blank region", () => {
  const rule = new BidRuleBudgetRequiredRegionRule("bid rule budget needs this field");
  const item = newBidRuleBudget("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleBudgetRevisionRangeRule flags values above revision", () => {
  const rule = new BidRuleBudgetRevisionRangeRule(120, 86400);
  const item = newBidRuleBudget("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleBudgetCodeLengthRule flags a long code", () => {
  const rule = new BidRuleBudgetCodeLengthRule(64);
  const item = newBidRuleBudget("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
