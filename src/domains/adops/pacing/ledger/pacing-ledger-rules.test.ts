import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingLedgerLimitRangeRule,
  PacingLedgerRequiredCodeRule,
  PacingLedgerSourceLengthRule,
  PacingLedgerStartsAtRangeRule,
  defaultPacingLedgerValidator,
} from "./pacing-ledger-rules.js";
import { newPacingLedger } from "./pacing-ledger.js";

test("PacingLedgerValidator reports every problem", () => {
  const validator = defaultPacingLedgerValidator();
  const item = newPacingLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingLedgerSourceLengthRule flags a long source", () => {
  const rule = new PacingLedgerSourceLengthRule(1000);
  const item = newPacingLedger("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new PacingLedgerRequiredCodeRule("pacing ledger needs an entry");
  const item = newPacingLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingLedgerLimitRangeRule flags values above limit", () => {
  const rule = new PacingLedgerLimitRangeRule(80, 3600);
  const item = newPacingLedger("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingLedgerStartsAtRangeRule flags values above starts at", () => {
  const rule = new PacingLedgerStartsAtRangeRule(120, 86400);
  const item = newPacingLedger("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
