import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBidRuleBudgetChannelLengthRule,
  ManualBidRuleBudgetRequiredChannelRule,
  ManualBidRuleBudgetRequiredTitleRule,
  ManualBidRuleBudgetRetriesRangeRule,
  ManualBidRuleBudgetStartsAtRangeRule,
  defaultManualBidRuleBudgetValidator,
} from "./manual-bid-rule-budget-rules.js";
import { newManualBidRuleBudget } from "./manual-bid-rule-budget.js";

test("ManualBidRuleBudgetValidator reports every problem", () => {
  const validator = defaultManualBidRuleBudgetValidator();
  const item = newManualBidRuleBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBidRuleBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new ManualBidRuleBudgetRequiredTitleRule("manual bid rule budget needs an entry");
  const item = newManualBidRuleBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBidRuleBudgetStartsAtRangeRule flags values above starts at", () => {
  const rule = new ManualBidRuleBudgetStartsAtRangeRule(80, 86400);
  const item = newManualBidRuleBudget("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBidRuleBudgetRequiredChannelRule flags a blank channel", () => {
  const rule = new ManualBidRuleBudgetRequiredChannelRule("manual bid rule budget needs this field");
  const item = newManualBidRuleBudget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBidRuleBudgetRetriesRangeRule flags values above retries", () => {
  const rule = new ManualBidRuleBudgetRetriesRangeRule(16, 64);
  const item = newManualBidRuleBudget("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBidRuleBudgetChannelLengthRule flags a long channel", () => {
  const rule = new ManualBidRuleBudgetChannelLengthRule(120);
  const item = newManualBidRuleBudget("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
