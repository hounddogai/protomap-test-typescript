import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalWindowLedgerBudgetRangeRule,
  GlobalWindowLedgerCodeLengthRule,
  GlobalWindowLedgerMarginRangeRule,
  GlobalWindowLedgerRequiredCodeRule,
  defaultGlobalWindowLedgerValidator,
} from "./global-window-ledger-rules.js";
import { newGlobalWindowLedger } from "./global-window-ledger.js";

test("GlobalWindowLedgerValidator reports every problem", () => {
  const validator = defaultGlobalWindowLedgerValidator();
  const item = newGlobalWindowLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalWindowLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalWindowLedgerRequiredCodeRule("global window ledger needs a value");
  const item = newGlobalWindowLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalWindowLedgerCodeLengthRule flags a long code", () => {
  const rule = new GlobalWindowLedgerCodeLengthRule(120);
  const item = newGlobalWindowLedger("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalWindowLedgerMarginRangeRule flags values above margin", () => {
  const rule = new GlobalWindowLedgerMarginRangeRule(9.6, 4337.9);
  const item = newGlobalWindowLedger("x", "y");
  item.margin = 4339.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalWindowLedgerBudgetRangeRule flags values above budget", () => {
  const rule = new GlobalWindowLedgerBudgetRangeRule(6.6, 4315.8);
  const item = newGlobalWindowLedger("x", "y");
  item.budget = 4317.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
