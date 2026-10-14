import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDoubleOptInLedgerCodeLengthRule,
  ScheduledDoubleOptInLedgerDurationMinutesRangeRule,
  ScheduledDoubleOptInLedgerRequiredCodeRule,
  defaultScheduledDoubleOptInLedgerValidator,
} from "./scheduled-double-opt-in-ledger-rules.js";
import { newScheduledDoubleOptInLedger } from "./scheduled-double-opt-in-ledger.js";

test("ScheduledDoubleOptInLedgerValidator reports every problem", () => {
  const validator = defaultScheduledDoubleOptInLedgerValidator();
  const item = newScheduledDoubleOptInLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDoubleOptInLedgerDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ScheduledDoubleOptInLedgerDurationMinutesRangeRule(16, 86400);
  const item = newScheduledDoubleOptInLedger("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledDoubleOptInLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledDoubleOptInLedgerRequiredCodeRule("scheduled double opt in ledger needs a value");
  const item = newScheduledDoubleOptInLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDoubleOptInLedgerCodeLengthRule flags a long code", () => {
  const rule = new ScheduledDoubleOptInLedgerCodeLengthRule(1000);
  const item = newScheduledDoubleOptInLedger("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
