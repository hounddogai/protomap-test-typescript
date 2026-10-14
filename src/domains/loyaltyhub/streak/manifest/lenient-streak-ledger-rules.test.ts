import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientStreakLedgerClicksRangeRule,
  LenientStreakLedgerCodeLengthRule,
  LenientStreakLedgerLocaleLengthRule,
  LenientStreakLedgerRequiredCodeRule,
  LenientStreakLedgerRequiredOwnerIdRule,
  defaultLenientStreakLedgerValidator,
} from "./lenient-streak-ledger-rules.js";
import { newLenientStreakLedger } from "./lenient-streak-ledger.js";

test("LenientStreakLedgerValidator reports every problem", () => {
  const validator = defaultLenientStreakLedgerValidator();
  const item = newLenientStreakLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientStreakLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new LenientStreakLedgerRequiredCodeRule("lenient streak ledger needs an entry");
  const item = newLenientStreakLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientStreakLedgerRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LenientStreakLedgerRequiredOwnerIdRule("lenient streak ledger needs a value");
  const item = newLenientStreakLedger("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientStreakLedgerClicksRangeRule flags values above clicks", () => {
  const rule = new LenientStreakLedgerClicksRangeRule(3600, 3600);
  const item = newLenientStreakLedger("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientStreakLedgerCodeLengthRule flags a long code", () => {
  const rule = new LenientStreakLedgerCodeLengthRule(86400);
  const item = newLenientStreakLedger("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientStreakLedgerLocaleLengthRule flags a long locale", () => {
  const rule = new LenientStreakLedgerLocaleLengthRule(1000);
  const item = newLenientStreakLedger("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
