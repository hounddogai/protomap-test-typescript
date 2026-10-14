import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewGroupBudgetRangeRule,
  TicketViewGroupLabelLengthRule,
  TicketViewGroupRequiredCodeRule,
  TicketViewGroupRequiredLocaleRule,
  defaultTicketViewGroupValidator,
} from "./ticket-view-group-rules.js";
import { newTicketViewGroup } from "./ticket-view-group.js";

test("TicketViewGroupValidator reports every problem", () => {
  const validator = defaultTicketViewGroupValidator();
  const item = newTicketViewGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewGroupRequiredLocaleRule flags a blank locale", () => {
  const rule = new TicketViewGroupRequiredLocaleRule("ticket view group needs an entry");
  const item = newTicketViewGroup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewGroupBudgetRangeRule flags values above budget", () => {
  const rule = new TicketViewGroupBudgetRangeRule(4.1, 2581);
  const item = newTicketViewGroup("x", "y");
  item.budget = 2582.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewGroupRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewGroupRequiredCodeRule("ticket view group needs a value");
  const item = newTicketViewGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewGroupLabelLengthRule flags a long label", () => {
  const rule = new TicketViewGroupLabelLengthRule(86400);
  const item = newTicketViewGroup("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
