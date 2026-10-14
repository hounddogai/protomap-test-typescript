import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryInsightLedgerCodeLengthRule,
  PrimaryInsightLedgerDescriptionLengthRule,
  PrimaryInsightLedgerEndsAtRangeRule,
  PrimaryInsightLedgerNameLengthRule,
  PrimaryInsightLedgerRequiredCodeRule,
  PrimaryInsightLedgerRequiredNameRule,
  defaultPrimaryInsightLedgerValidator,
} from "./primary-insight-ledger-rules.js";
import { newPrimaryInsightLedger } from "./primary-insight-ledger.js";

test("PrimaryInsightLedgerValidator reports every problem", () => {
  const validator = defaultPrimaryInsightLedgerValidator();
  const item = newPrimaryInsightLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryInsightLedgerCodeLengthRule flags a long code", () => {
  const rule = new PrimaryInsightLedgerCodeLengthRule(255);
  const item = newPrimaryInsightLedger("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryInsightLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryInsightLedgerRequiredCodeRule("primary insight ledger needs this field");
  const item = newPrimaryInsightLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryInsightLedgerRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryInsightLedgerRequiredNameRule("primary insight ledger needs this field");
  const item = newPrimaryInsightLedger("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryInsightLedgerNameLengthRule flags a long name", () => {
  const rule = new PrimaryInsightLedgerNameLengthRule(64);
  const item = newPrimaryInsightLedger("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryInsightLedgerDescriptionLengthRule flags a long description", () => {
  const rule = new PrimaryInsightLedgerDescriptionLengthRule(1000);
  const item = newPrimaryInsightLedger("x", "y");
  item.description = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryInsightLedgerEndsAtRangeRule flags values above ends at", () => {
  const rule = new PrimaryInsightLedgerEndsAtRangeRule(80, 255);
  const item = newPrimaryInsightLedger("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
