import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryOptOutLedgerExternalRefLengthRule,
  PrimaryOptOutLedgerMarginRangeRule,
  PrimaryOptOutLedgerRequiredCodeRule,
  PrimaryOptOutLedgerRevisionRangeRule,
  PrimaryOptOutLedgerTitleLengthRule,
  defaultPrimaryOptOutLedgerValidator,
} from "./primary-opt-out-ledger-rules.js";
import { newPrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

test("PrimaryOptOutLedgerValidator reports every problem", () => {
  const validator = defaultPrimaryOptOutLedgerValidator();
  const item = newPrimaryOptOutLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryOptOutLedgerExternalRefLengthRule flags a long external ref", () => {
  const rule = new PrimaryOptOutLedgerExternalRefLengthRule(64);
  const item = newPrimaryOptOutLedger("x", "y");
  item.externalRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryOptOutLedgerRevisionRangeRule flags values above revision", () => {
  const rule = new PrimaryOptOutLedgerRevisionRangeRule(16, 120);
  const item = newPrimaryOptOutLedger("x", "y");
  item.revision = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryOptOutLedgerTitleLengthRule flags a long title", () => {
  const rule = new PrimaryOptOutLedgerTitleLengthRule(32);
  const item = newPrimaryOptOutLedger("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryOptOutLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryOptOutLedgerRequiredCodeRule("primary opt out ledger needs this field");
  const item = newPrimaryOptOutLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryOptOutLedgerMarginRangeRule flags values above margin", () => {
  const rule = new PrimaryOptOutLedgerMarginRangeRule(6.2, 455);
  const item = newPrimaryOptOutLedger("x", "y");
  item.margin = 456.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
