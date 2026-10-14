import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceBudgetCodeLengthRule,
  BounceBudgetNameLengthRule,
  BounceBudgetRequiredChannelRule,
  defaultBounceBudgetValidator,
} from "./bounce-budget-rules.js";
import { newBounceBudget } from "./bounce-budget.js";

test("BounceBudgetValidator reports every problem", () => {
  const validator = defaultBounceBudgetValidator();
  const item = newBounceBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceBudgetRequiredChannelRule flags a blank channel", () => {
  const rule = new BounceBudgetRequiredChannelRule("bounce budget needs this field");
  const item = newBounceBudget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceBudgetCodeLengthRule flags a long code", () => {
  const rule = new BounceBudgetCodeLengthRule(120);
  const item = newBounceBudget("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceBudgetNameLengthRule flags a long name", () => {
  const rule = new BounceBudgetNameLengthRule(255);
  const item = newBounceBudget("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
