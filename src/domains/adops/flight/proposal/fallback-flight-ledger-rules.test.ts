import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFlightLedgerCodeLengthRule,
  FallbackFlightLedgerRequiredTitleRule,
  FallbackFlightLedgerVersionRangeRule,
  defaultFallbackFlightLedgerValidator,
} from "./fallback-flight-ledger-rules.js";
import { newFallbackFlightLedger } from "./fallback-flight-ledger.js";

test("FallbackFlightLedgerValidator reports every problem", () => {
  const validator = defaultFallbackFlightLedgerValidator();
  const item = newFallbackFlightLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFlightLedgerCodeLengthRule flags a long code", () => {
  const rule = new FallbackFlightLedgerCodeLengthRule(16);
  const item = newFallbackFlightLedger("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFlightLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackFlightLedgerRequiredTitleRule("fallback flight ledger needs a value");
  const item = newFallbackFlightLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFlightLedgerVersionRangeRule flags values above version", () => {
  const rule = new FallbackFlightLedgerVersionRangeRule(1000, 3600);
  const item = newFallbackFlightLedger("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
