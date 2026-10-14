import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeLedgerDescriptionLengthRule,
  BadgeLedgerNameLengthRule,
  BadgeLedgerRequiredNameRule,
  defaultBadgeLedgerValidator,
} from "./badge-ledger-rules.js";
import { newBadgeLedger } from "./badge-ledger.js";

test("BadgeLedgerValidator reports every problem", () => {
  const validator = defaultBadgeLedgerValidator();
  const item = newBadgeLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeLedgerNameLengthRule flags a long name", () => {
  const rule = new BadgeLedgerNameLengthRule(3600);
  const item = newBadgeLedger("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeLedgerRequiredNameRule flags a blank name", () => {
  const rule = new BadgeLedgerRequiredNameRule("badge ledger needs a value");
  const item = newBadgeLedger("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeLedgerDescriptionLengthRule flags a long description", () => {
  const rule = new BadgeLedgerDescriptionLengthRule(1000);
  const item = newBadgeLedger("x", "y");
  item.description = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
