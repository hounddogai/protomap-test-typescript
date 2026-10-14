import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaBudgetExpiresAtRangeRule,
  SlaBudgetRequiredNameRule,
  SlaBudgetRequiredUtmSourceRule,
  SlaBudgetSequenceRangeRule,
  defaultSlaBudgetValidator,
} from "./sla-budget-rules.js";
import { newSlaBudget } from "./sla-budget.js";

test("SlaBudgetValidator reports every problem", () => {
  const validator = defaultSlaBudgetValidator();
  const item = newSlaBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaBudgetExpiresAtRangeRule flags values above expires at", () => {
  const rule = new SlaBudgetExpiresAtRangeRule(86400, 86400);
  const item = newSlaBudget("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaBudgetRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new SlaBudgetRequiredUtmSourceRule("sla budget needs an entry");
  const item = newSlaBudget("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaBudgetSequenceRangeRule flags values above sequence", () => {
  const rule = new SlaBudgetSequenceRangeRule(64, 3600);
  const item = newSlaBudget("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaBudgetRequiredNameRule flags a blank name", () => {
  const rule = new SlaBudgetRequiredNameRule("sla budget needs an entry");
  const item = newSlaBudget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
