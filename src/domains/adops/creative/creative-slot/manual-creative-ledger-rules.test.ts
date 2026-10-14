import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualCreativeLedgerAmountRangeRule,
  ManualCreativeLedgerCountryLengthRule,
  ManualCreativeLedgerRequiredTitleRule,
  ManualCreativeLedgerTitleLengthRule,
  ManualCreativeLedgerWindowDaysRangeRule,
  defaultManualCreativeLedgerValidator,
} from "./manual-creative-ledger-rules.js";
import { newManualCreativeLedger } from "./manual-creative-ledger.js";

test("ManualCreativeLedgerValidator reports every problem", () => {
  const validator = defaultManualCreativeLedgerValidator();
  const item = newManualCreativeLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualCreativeLedgerCountryLengthRule flags a long country", () => {
  const rule = new ManualCreativeLedgerCountryLengthRule(3600);
  const item = newManualCreativeLedger("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreativeLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new ManualCreativeLedgerRequiredTitleRule("manual creative ledger needs an entry");
  const item = newManualCreativeLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualCreativeLedgerAmountRangeRule flags values above amount", () => {
  const rule = new ManualCreativeLedgerAmountRangeRule(8, 4146.4);
  const item = newManualCreativeLedger("x", "y");
  item.amount = 4147.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualCreativeLedgerWindowDaysRangeRule flags values above window days", () => {
  const rule = new ManualCreativeLedgerWindowDaysRangeRule(86400, 86400);
  const item = newManualCreativeLedger("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualCreativeLedgerTitleLengthRule flags a long title", () => {
  const rule = new ManualCreativeLedgerTitleLengthRule(80);
  const item = newManualCreativeLedger("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
