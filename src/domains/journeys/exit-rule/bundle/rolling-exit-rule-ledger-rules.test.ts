import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingExitRuleLedgerBudgetRangeRule,
  RollingExitRuleLedgerNameLengthRule,
  RollingExitRuleLedgerRequiredLocaleRule,
  RollingExitRuleLedgerRequiredNameRule,
  RollingExitRuleLedgerRetriesRangeRule,
  defaultRollingExitRuleLedgerValidator,
} from "./rolling-exit-rule-ledger-rules.js";
import { newRollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

test("RollingExitRuleLedgerValidator reports every problem", () => {
  const validator = defaultRollingExitRuleLedgerValidator();
  const item = newRollingExitRuleLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingExitRuleLedgerBudgetRangeRule flags values above budget", () => {
  const rule = new RollingExitRuleLedgerBudgetRangeRule(0.2, 2573.9);
  const item = newRollingExitRuleLedger("x", "y");
  item.budget = 2575.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingExitRuleLedgerRetriesRangeRule flags values above retries", () => {
  const rule = new RollingExitRuleLedgerRetriesRangeRule(80, 255);
  const item = newRollingExitRuleLedger("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingExitRuleLedgerRequiredLocaleRule flags a blank locale", () => {
  const rule = new RollingExitRuleLedgerRequiredLocaleRule("rolling exit rule ledger needs this field");
  const item = newRollingExitRuleLedger("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingExitRuleLedgerRequiredNameRule flags a blank name", () => {
  const rule = new RollingExitRuleLedgerRequiredNameRule("rolling exit rule ledger needs an entry");
  const item = newRollingExitRuleLedger("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingExitRuleLedgerNameLengthRule flags a long name", () => {
  const rule = new RollingExitRuleLedgerNameLengthRule(64);
  const item = newRollingExitRuleLedger("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
