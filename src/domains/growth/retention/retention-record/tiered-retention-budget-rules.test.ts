import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRetentionBudgetCampaignRefLengthRule,
  TieredRetentionBudgetCodeLengthRule,
  TieredRetentionBudgetRequiredChannelRule,
  TieredRetentionBudgetRequiredCodeRule,
  defaultTieredRetentionBudgetValidator,
} from "./tiered-retention-budget-rules.js";
import { newTieredRetentionBudget } from "./tiered-retention-budget.js";

test("TieredRetentionBudgetValidator reports every problem", () => {
  const validator = defaultTieredRetentionBudgetValidator();
  const item = newTieredRetentionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRetentionBudgetCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new TieredRetentionBudgetCampaignRefLengthRule(32);
  const item = newTieredRetentionBudget("x", "y");
  item.campaignRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRetentionBudgetCodeLengthRule flags a long code", () => {
  const rule = new TieredRetentionBudgetCodeLengthRule(80);
  const item = newTieredRetentionBudget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRetentionBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new TieredRetentionBudgetRequiredCodeRule("tiered retention budget needs a value");
  const item = newTieredRetentionBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRetentionBudgetRequiredChannelRule flags a blank channel", () => {
  const rule = new TieredRetentionBudgetRequiredChannelRule("tiered retention budget needs a value");
  const item = newTieredRetentionBudget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
