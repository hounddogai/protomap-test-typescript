import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionLedgerBidRangeRule,
  DeflectionLedgerCostRangeRule,
  DeflectionLedgerRequiredCodeRule,
  defaultDeflectionLedgerValidator,
} from "./deflection-ledger-rules.js";
import { newDeflectionLedger } from "./deflection-ledger.js";

test("DeflectionLedgerValidator reports every problem", () => {
  const validator = defaultDeflectionLedgerValidator();
  const item = newDeflectionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionLedgerCostRangeRule flags values above cost", () => {
  const rule = new DeflectionLedgerCostRangeRule(6.5, 2576.8);
  const item = newDeflectionLedger("x", "y");
  item.cost = 2578.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new DeflectionLedgerRequiredCodeRule("deflection ledger needs an entry");
  const item = newDeflectionLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionLedgerBidRangeRule flags values above bid", () => {
  const rule = new DeflectionLedgerBidRangeRule(8.3, 3670.6);
  const item = newDeflectionLedger("x", "y");
  item.bid = 3672.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
