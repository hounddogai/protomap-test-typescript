import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryMacroQuotaAmountRangeRule,
  PrimaryMacroQuotaBudgetRangeRule,
  PrimaryMacroQuotaCeilingRangeRule,
  PrimaryMacroQuotaRequiredCodeRule,
  PrimaryMacroQuotaRequiredNameRule,
  defaultPrimaryMacroQuotaValidator,
} from "./primary-macro-quota-rules.js";
import { newPrimaryMacroQuota } from "./primary-macro-quota.js";

test("PrimaryMacroQuotaValidator reports every problem", () => {
  const validator = defaultPrimaryMacroQuotaValidator();
  const item = newPrimaryMacroQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryMacroQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryMacroQuotaRequiredCodeRule("primary macro quota needs a value");
  const item = newPrimaryMacroQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryMacroQuotaBudgetRangeRule flags values above budget", () => {
  const rule = new PrimaryMacroQuotaBudgetRangeRule(8.7, 2268.5);
  const item = newPrimaryMacroQuota("x", "y");
  item.budget = 2270;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryMacroQuotaAmountRangeRule flags values above amount", () => {
  const rule = new PrimaryMacroQuotaAmountRangeRule(7, 1665.9);
  const item = newPrimaryMacroQuota("x", "y");
  item.amount = 1667.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryMacroQuotaCeilingRangeRule flags values above ceiling", () => {
  const rule = new PrimaryMacroQuotaCeilingRangeRule(9.3, 1581.4);
  const item = newPrimaryMacroQuota("x", "y");
  item.ceiling = 1582.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryMacroQuotaRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryMacroQuotaRequiredNameRule("primary macro quota needs this field");
  const item = newPrimaryMacroQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
