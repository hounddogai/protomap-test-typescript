import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFlightLedgerLabelLengthRule,
  DefaultFlightLedgerRequiredCodeRule,
  DefaultFlightLedgerRequiredLabelRule,
  DefaultFlightLedgerTitleLengthRule,
  defaultDefaultFlightLedgerValidator,
} from "./default-flight-ledger-rules.js";
import { newDefaultFlightLedger } from "./default-flight-ledger.js";

test("DefaultFlightLedgerValidator reports every problem", () => {
  const validator = defaultDefaultFlightLedgerValidator();
  const item = newDefaultFlightLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFlightLedgerLabelLengthRule flags a long label", () => {
  const rule = new DefaultFlightLedgerLabelLengthRule(3600);
  const item = newDefaultFlightLedger("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFlightLedgerTitleLengthRule flags a long title", () => {
  const rule = new DefaultFlightLedgerTitleLengthRule(80);
  const item = newDefaultFlightLedger("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFlightLedgerRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultFlightLedgerRequiredLabelRule("default flight ledger needs this field");
  const item = newDefaultFlightLedger("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFlightLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultFlightLedgerRequiredCodeRule("default flight ledger needs an entry");
  const item = newDefaultFlightLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
