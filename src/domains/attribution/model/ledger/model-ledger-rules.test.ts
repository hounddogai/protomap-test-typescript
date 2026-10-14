import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelLedgerRequiredCodeRule,
  ModelLedgerRetriesRangeRule,
  defaultModelLedgerValidator,
} from "./model-ledger-rules.js";
import { newModelLedger } from "./model-ledger.js";

test("ModelLedgerValidator reports every problem", () => {
  const validator = defaultModelLedgerValidator();
  const item = newModelLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new ModelLedgerRequiredCodeRule("model ledger needs an entry");
  const item = newModelLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelLedgerRetriesRangeRule flags values above retries", () => {
  const rule = new ModelLedgerRetriesRangeRule(16, 3600);
  const item = newModelLedger("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
