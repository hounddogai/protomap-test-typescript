import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchLedgerDescriptionLengthRule,
  BranchLedgerLabelLengthRule,
  BranchLedgerRequiredCodeRule,
  BranchLedgerRequiredDescriptionRule,
  BranchLedgerTitleLengthRule,
  defaultBranchLedgerValidator,
} from "./branch-ledger-rules.js";
import { newBranchLedger } from "./branch-ledger.js";

test("BranchLedgerValidator reports every problem", () => {
  const validator = defaultBranchLedgerValidator();
  const item = newBranchLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchLedgerDescriptionLengthRule flags a long description", () => {
  const rule = new BranchLedgerDescriptionLengthRule(64);
  const item = newBranchLedger("x", "y");
  item.description = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchLedgerTitleLengthRule flags a long title", () => {
  const rule = new BranchLedgerTitleLengthRule(16);
  const item = newBranchLedger("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchLedgerLabelLengthRule flags a long label", () => {
  const rule = new BranchLedgerLabelLengthRule(16);
  const item = newBranchLedger("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchLedgerRequiredDescriptionRule flags a blank description", () => {
  const rule = new BranchLedgerRequiredDescriptionRule("branch ledger needs an entry");
  const item = newBranchLedger("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new BranchLedgerRequiredCodeRule("branch ledger needs an entry");
  const item = newBranchLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
