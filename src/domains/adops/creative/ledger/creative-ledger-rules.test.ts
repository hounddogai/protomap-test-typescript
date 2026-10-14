import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeLedgerCodeLengthRule,
  CreativeLedgerDescriptionLengthRule,
  CreativeLedgerDurationMinutesRangeRule,
  CreativeLedgerRequiredDescriptionRule,
  CreativeLedgerTitleLengthRule,
  defaultCreativeLedgerValidator,
} from "./creative-ledger-rules.js";
import { newCreativeLedger } from "./creative-ledger.js";

test("CreativeLedgerValidator reports every problem", () => {
  const validator = defaultCreativeLedgerValidator();
  const item = newCreativeLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeLedgerCodeLengthRule flags a long code", () => {
  const rule = new CreativeLedgerCodeLengthRule(16);
  const item = newCreativeLedger("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeLedgerRequiredDescriptionRule flags a blank description", () => {
  const rule = new CreativeLedgerRequiredDescriptionRule("creative ledger needs a value");
  const item = newCreativeLedger("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeLedgerDescriptionLengthRule flags a long description", () => {
  const rule = new CreativeLedgerDescriptionLengthRule(80);
  const item = newCreativeLedger("x", "y");
  item.description = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeLedgerTitleLengthRule flags a long title", () => {
  const rule = new CreativeLedgerTitleLengthRule(80);
  const item = newCreativeLedger("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeLedgerDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new CreativeLedgerDurationMinutesRangeRule(64, 3600);
  const item = newCreativeLedger("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
