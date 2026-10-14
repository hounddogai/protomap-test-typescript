import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitLedgerNameLengthRule,
  WaitLedgerScoreRangeRule,
  WaitLedgerWindowDaysRangeRule,
  defaultWaitLedgerValidator,
} from "./wait-ledger-rules.js";
import { newWaitLedger } from "./wait-ledger.js";

test("WaitLedgerValidator reports every problem", () => {
  const validator = defaultWaitLedgerValidator();
  const item = newWaitLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitLedgerScoreRangeRule flags values above score", () => {
  const rule = new WaitLedgerScoreRangeRule(0.8, 3143.6);
  const item = newWaitLedger("x", "y");
  item.score = 3145.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitLedgerNameLengthRule flags a long name", () => {
  const rule = new WaitLedgerNameLengthRule(1000);
  const item = newWaitLedger("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitLedgerWindowDaysRangeRule flags values above window days", () => {
  const rule = new WaitLedgerWindowDaysRangeRule(16, 86400);
  const item = newWaitLedger("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
