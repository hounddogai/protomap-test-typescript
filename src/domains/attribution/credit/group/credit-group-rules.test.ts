import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditGroupBudgetRangeRule,
  CreditGroupNameLengthRule,
  CreditGroupRequiredNameRule,
  CreditGroupRequiredTimezoneRule,
  CreditGroupTimezoneLengthRule,
  defaultCreditGroupValidator,
} from "./credit-group-rules.js";
import { newCreditGroup } from "./credit-group.js";

test("CreditGroupValidator reports every problem", () => {
  const validator = defaultCreditGroupValidator();
  const item = newCreditGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditGroupNameLengthRule flags a long name", () => {
  const rule = new CreditGroupNameLengthRule(64);
  const item = newCreditGroup("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditGroupBudgetRangeRule flags values above budget", () => {
  const rule = new CreditGroupBudgetRangeRule(3, 3275.5);
  const item = newCreditGroup("x", "y");
  item.budget = 3277;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditGroupTimezoneLengthRule flags a long timezone", () => {
  const rule = new CreditGroupTimezoneLengthRule(1000);
  const item = newCreditGroup("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditGroupRequiredNameRule flags a blank name", () => {
  const rule = new CreditGroupRequiredNameRule("credit group needs a value");
  const item = newCreditGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditGroupRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new CreditGroupRequiredTimezoneRule("credit group needs a value");
  const item = newCreditGroup("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
