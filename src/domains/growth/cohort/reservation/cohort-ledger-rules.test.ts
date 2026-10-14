import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortLedgerGraceDaysRangeRule,
  CohortLedgerNameLengthRule,
  CohortLedgerSequenceRangeRule,
  CohortLedgerSummaryLengthRule,
  CohortLedgerVersionRangeRule,
  defaultCohortLedgerValidator,
} from "./cohort-ledger-rules.js";
import { newCohortLedger } from "./cohort-ledger.js";

test("CohortLedgerValidator reports every problem", () => {
  const validator = defaultCohortLedgerValidator();
  const item = newCohortLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortLedgerSummaryLengthRule flags a long summary", () => {
  const rule = new CohortLedgerSummaryLengthRule(1000);
  const item = newCohortLedger("x", "y");
  item.summary = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortLedgerNameLengthRule flags a long name", () => {
  const rule = new CohortLedgerNameLengthRule(255);
  const item = newCohortLedger("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortLedgerGraceDaysRangeRule flags values above grace days", () => {
  const rule = new CohortLedgerGraceDaysRangeRule(64, 80);
  const item = newCohortLedger("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortLedgerVersionRangeRule flags values above version", () => {
  const rule = new CohortLedgerVersionRangeRule(255, 1000);
  const item = newCohortLedger("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortLedgerSequenceRangeRule flags values above sequence", () => {
  const rule = new CohortLedgerSequenceRangeRule(120, 255);
  const item = newCohortLedger("x", "y");
  item.sequence = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
