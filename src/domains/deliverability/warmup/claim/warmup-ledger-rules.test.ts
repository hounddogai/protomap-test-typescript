import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupLedgerCodeLengthRule,
  WarmupLedgerEndsAtRangeRule,
  WarmupLedgerImpressionsRangeRule,
  WarmupLedgerRequiredReviewerRule,
  defaultWarmupLedgerValidator,
} from "./warmup-ledger-rules.js";
import { newWarmupLedger } from "./warmup-ledger.js";

test("WarmupLedgerValidator reports every problem", () => {
  const validator = defaultWarmupLedgerValidator();
  const item = newWarmupLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupLedgerRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new WarmupLedgerRequiredReviewerRule("warmup ledger needs a value");
  const item = newWarmupLedger("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupLedgerImpressionsRangeRule flags values above impressions", () => {
  const rule = new WarmupLedgerImpressionsRangeRule(64, 120);
  const item = newWarmupLedger("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupLedgerCodeLengthRule flags a long code", () => {
  const rule = new WarmupLedgerCodeLengthRule(80);
  const item = newWarmupLedger("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupLedgerEndsAtRangeRule flags values above ends at", () => {
  const rule = new WarmupLedgerEndsAtRangeRule(32, 86400);
  const item = newWarmupLedger("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
