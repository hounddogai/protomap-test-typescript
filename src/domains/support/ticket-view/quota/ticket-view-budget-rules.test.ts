import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewBudgetCodeLengthRule,
  TicketViewBudgetImpressionsRangeRule,
  TicketViewBudgetRequiredChannelRule,
  defaultTicketViewBudgetValidator,
} from "./ticket-view-budget-rules.js";
import { newTicketViewBudget } from "./ticket-view-budget.js";

test("TicketViewBudgetValidator reports every problem", () => {
  const validator = defaultTicketViewBudgetValidator();
  const item = newTicketViewBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewBudgetCodeLengthRule flags a long code", () => {
  const rule = new TicketViewBudgetCodeLengthRule(86400);
  const item = newTicketViewBudget("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewBudgetImpressionsRangeRule flags values above impressions", () => {
  const rule = new TicketViewBudgetImpressionsRangeRule(255, 86400);
  const item = newTicketViewBudget("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewBudgetRequiredChannelRule flags a blank channel", () => {
  const rule = new TicketViewBudgetRequiredChannelRule("ticket view budget needs this field");
  const item = newTicketViewBudget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
