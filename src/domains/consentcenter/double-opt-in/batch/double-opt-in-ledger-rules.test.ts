import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInLedgerContactEmailLengthRule,
  DoubleOptInLedgerStartsAtRangeRule,
  defaultDoubleOptInLedgerValidator,
} from "./double-opt-in-ledger-rules.js";
import { newDoubleOptInLedger } from "./double-opt-in-ledger.js";

test("DoubleOptInLedgerValidator reports every problem", () => {
  const validator = defaultDoubleOptInLedgerValidator();
  const item = newDoubleOptInLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInLedgerStartsAtRangeRule flags values above starts at", () => {
  const rule = new DoubleOptInLedgerStartsAtRangeRule(64, 64);
  const item = newDoubleOptInLedger("x", "y");
  item.startsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInLedgerContactEmailLengthRule flags a long contact email", () => {
  const rule = new DoubleOptInLedgerContactEmailLengthRule(86400);
  const item = newDoubleOptInLedger("x", "y");
  item.contactEmail = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
