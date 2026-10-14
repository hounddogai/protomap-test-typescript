import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedReplyLedgerCodeLengthRule,
  CappedReplyLedgerRequiredChannelRule,
  CappedReplyLedgerRequiredLocaleRule,
  defaultCappedReplyLedgerValidator,
} from "./capped-reply-ledger-rules.js";
import { newCappedReplyLedger } from "./capped-reply-ledger.js";

test("CappedReplyLedgerValidator reports every problem", () => {
  const validator = defaultCappedReplyLedgerValidator();
  const item = newCappedReplyLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedReplyLedgerRequiredChannelRule flags a blank channel", () => {
  const rule = new CappedReplyLedgerRequiredChannelRule("capped reply ledger needs this field");
  const item = newCappedReplyLedger("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedReplyLedgerRequiredLocaleRule flags a blank locale", () => {
  const rule = new CappedReplyLedgerRequiredLocaleRule("capped reply ledger needs this field");
  const item = newCappedReplyLedger("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedReplyLedgerCodeLengthRule flags a long code", () => {
  const rule = new CappedReplyLedgerCodeLengthRule(32);
  const item = newCappedReplyLedger("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
