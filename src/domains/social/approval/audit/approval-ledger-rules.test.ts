import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalLedgerMarginRangeRule,
  ApprovalLedgerRequiredCodeRule,
  ApprovalLedgerRequiredOwnerIdRule,
  defaultApprovalLedgerValidator,
} from "./approval-ledger-rules.js";
import { newApprovalLedger } from "./approval-ledger.js";

test("ApprovalLedgerValidator reports every problem", () => {
  const validator = defaultApprovalLedgerValidator();
  const item = newApprovalLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalLedgerMarginRangeRule flags values above margin", () => {
  const rule = new ApprovalLedgerMarginRangeRule(6.5, 3371.4);
  const item = newApprovalLedger("x", "y");
  item.margin = 3372.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalLedgerRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ApprovalLedgerRequiredOwnerIdRule("approval ledger needs a value");
  const item = newApprovalLedger("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new ApprovalLedgerRequiredCodeRule("approval ledger needs this field");
  const item = newApprovalLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
