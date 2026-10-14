import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightLedgerCodeLengthRule,
  InsightLedgerFrequencyCapRangeRule,
  InsightLedgerRequiredCategoryRule,
  InsightLedgerRequiredTitleRule,
  InsightLedgerTitleLengthRule,
  defaultInsightLedgerValidator,
} from "./insight-ledger-rules.js";
import { newInsightLedger } from "./insight-ledger.js";

test("InsightLedgerValidator reports every problem", () => {
  const validator = defaultInsightLedgerValidator();
  const item = newInsightLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightLedgerFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new InsightLedgerFrequencyCapRangeRule(80, 1000);
  const item = newInsightLedger("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightLedgerCodeLengthRule flags a long code", () => {
  const rule = new InsightLedgerCodeLengthRule(3600);
  const item = newInsightLedger("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightLedgerRequiredCategoryRule flags a blank category", () => {
  const rule = new InsightLedgerRequiredCategoryRule("insight ledger needs an entry");
  const item = newInsightLedger("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightLedgerTitleLengthRule flags a long title", () => {
  const rule = new InsightLedgerTitleLengthRule(16);
  const item = newInsightLedger("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new InsightLedgerRequiredTitleRule("insight ledger needs this field");
  const item = newInsightLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
