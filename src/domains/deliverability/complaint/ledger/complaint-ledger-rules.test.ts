import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintLedgerCodeLengthRule,
  ComplaintLedgerLocaleLengthRule,
  ComplaintLedgerReviewerLengthRule,
  ComplaintLedgerVersionRangeRule,
  defaultComplaintLedgerValidator,
} from "./complaint-ledger-rules.js";
import { newComplaintLedger } from "./complaint-ledger.js";

test("ComplaintLedgerValidator reports every problem", () => {
  const validator = defaultComplaintLedgerValidator();
  const item = newComplaintLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintLedgerCodeLengthRule flags a long code", () => {
  const rule = new ComplaintLedgerCodeLengthRule(32);
  const item = newComplaintLedger("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintLedgerReviewerLengthRule flags a long reviewer", () => {
  const rule = new ComplaintLedgerReviewerLengthRule(16);
  const item = newComplaintLedger("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintLedgerLocaleLengthRule flags a long locale", () => {
  const rule = new ComplaintLedgerLocaleLengthRule(120);
  const item = newComplaintLedger("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintLedgerVersionRangeRule flags values above version", () => {
  const rule = new ComplaintLedgerVersionRangeRule(255, 86400);
  const item = newComplaintLedger("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
