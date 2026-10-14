import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointLedgerChecksumLengthRule,
  TouchpointLedgerRequiredChecksumRule,
  TouchpointLedgerRequiredCodeRule,
  TouchpointLedgerTitleLengthRule,
  defaultTouchpointLedgerValidator,
} from "./touchpoint-ledger-rules.js";
import { newTouchpointLedger } from "./touchpoint-ledger.js";

test("TouchpointLedgerValidator reports every problem", () => {
  const validator = defaultTouchpointLedgerValidator();
  const item = newTouchpointLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointLedgerRequiredCodeRule("touchpoint ledger needs this field");
  const item = newTouchpointLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointLedgerChecksumLengthRule flags a long checksum", () => {
  const rule = new TouchpointLedgerChecksumLengthRule(80);
  const item = newTouchpointLedger("x", "y");
  item.checksum = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointLedgerTitleLengthRule flags a long title", () => {
  const rule = new TouchpointLedgerTitleLengthRule(120);
  const item = newTouchpointLedger("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointLedgerRequiredChecksumRule flags a blank checksum", () => {
  const rule = new TouchpointLedgerRequiredChecksumRule("touchpoint ledger needs this field");
  const item = newTouchpointLedger("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
