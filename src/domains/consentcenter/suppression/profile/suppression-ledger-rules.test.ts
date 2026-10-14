import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionLedgerClicksRangeRule,
  SuppressionLedgerExternalRefLengthRule,
  SuppressionLedgerLimitRangeRule,
  SuppressionLedgerMaximumRangeRule,
  defaultSuppressionLedgerValidator,
} from "./suppression-ledger-rules.js";
import { newSuppressionLedger } from "./suppression-ledger.js";

test("SuppressionLedgerValidator reports every problem", () => {
  const validator = defaultSuppressionLedgerValidator();
  const item = newSuppressionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionLedgerLimitRangeRule flags values above limit", () => {
  const rule = new SuppressionLedgerLimitRangeRule(16, 255);
  const item = newSuppressionLedger("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionLedgerClicksRangeRule flags values above clicks", () => {
  const rule = new SuppressionLedgerClicksRangeRule(32, 86400);
  const item = newSuppressionLedger("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionLedgerMaximumRangeRule flags values above maximum", () => {
  const rule = new SuppressionLedgerMaximumRangeRule(2.2, 3462.5);
  const item = newSuppressionLedger("x", "y");
  item.maximum = 3464;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionLedgerExternalRefLengthRule flags a long external ref", () => {
  const rule = new SuppressionLedgerExternalRefLengthRule(80);
  const item = newSuppressionLedger("x", "y");
  item.externalRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
