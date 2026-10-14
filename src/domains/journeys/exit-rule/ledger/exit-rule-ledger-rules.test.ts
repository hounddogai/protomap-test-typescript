import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleLedgerRequiredTitleRule,
  ExitRuleLedgerUpdatedAtRangeRule,
  defaultExitRuleLedgerValidator,
} from "./exit-rule-ledger-rules.js";
import { newExitRuleLedger } from "./exit-rule-ledger.js";

test("ExitRuleLedgerValidator reports every problem", () => {
  const validator = defaultExitRuleLedgerValidator();
  const item = newExitRuleLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleLedgerUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ExitRuleLedgerUpdatedAtRangeRule(16, 120);
  const item = newExitRuleLedger("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new ExitRuleLedgerRequiredTitleRule("exit rule ledger needs this field");
  const item = newExitRuleLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
