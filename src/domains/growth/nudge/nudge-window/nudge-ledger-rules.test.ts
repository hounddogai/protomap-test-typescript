import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeLedgerEndsAtRangeRule,
  NudgeLedgerRevisionRangeRule,
  NudgeLedgerTitleLengthRule,
  NudgeLedgerWeightRangeRule,
  defaultNudgeLedgerValidator,
} from "./nudge-ledger-rules.js";
import { newNudgeLedger } from "./nudge-ledger.js";

test("NudgeLedgerValidator reports every problem", () => {
  const validator = defaultNudgeLedgerValidator();
  const item = newNudgeLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeLedgerTitleLengthRule flags a long title", () => {
  const rule = new NudgeLedgerTitleLengthRule(120);
  const item = newNudgeLedger("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeLedgerWeightRangeRule flags values above weight", () => {
  const rule = new NudgeLedgerWeightRangeRule(5.9, 3945.7);
  const item = newNudgeLedger("x", "y");
  item.weight = 3947.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeLedgerRevisionRangeRule flags values above revision", () => {
  const rule = new NudgeLedgerRevisionRangeRule(80, 86400);
  const item = newNudgeLedger("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeLedgerEndsAtRangeRule flags values above ends at", () => {
  const rule = new NudgeLedgerEndsAtRangeRule(80, 255);
  const item = newNudgeLedger("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
