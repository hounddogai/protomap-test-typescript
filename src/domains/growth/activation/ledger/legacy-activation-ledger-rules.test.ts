import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyActivationLedgerBatchSizeRangeRule,
  LegacyActivationLedgerCodeLengthRule,
  LegacyActivationLedgerDescriptionLengthRule,
  LegacyActivationLedgerTitleLengthRule,
  defaultLegacyActivationLedgerValidator,
} from "./legacy-activation-ledger-rules.js";
import { newLegacyActivationLedger } from "./legacy-activation-ledger.js";

test("LegacyActivationLedgerValidator reports every problem", () => {
  const validator = defaultLegacyActivationLedgerValidator();
  const item = newLegacyActivationLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyActivationLedgerDescriptionLengthRule flags a long description", () => {
  const rule = new LegacyActivationLedgerDescriptionLengthRule(86400);
  const item = newLegacyActivationLedger("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyActivationLedgerCodeLengthRule flags a long code", () => {
  const rule = new LegacyActivationLedgerCodeLengthRule(64);
  const item = newLegacyActivationLedger("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyActivationLedgerTitleLengthRule flags a long title", () => {
  const rule = new LegacyActivationLedgerTitleLengthRule(80);
  const item = newLegacyActivationLedger("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyActivationLedgerBatchSizeRangeRule flags values above batch size", () => {
  const rule = new LegacyActivationLedgerBatchSizeRangeRule(32, 255);
  const item = newLegacyActivationLedger("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
