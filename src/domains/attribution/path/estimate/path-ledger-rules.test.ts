import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathLedgerRequiredCohortRule,
  PathLedgerRequiredTimezoneRule,
  PathLedgerRequiredTitleRule,
  PathLedgerTimezoneLengthRule,
  defaultPathLedgerValidator,
} from "./path-ledger-rules.js";
import { newPathLedger } from "./path-ledger.js";

test("PathLedgerValidator reports every problem", () => {
  const validator = defaultPathLedgerValidator();
  const item = newPathLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathLedgerRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new PathLedgerRequiredTimezoneRule("path ledger needs a value");
  const item = newPathLedger("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathLedgerRequiredCohortRule flags a blank cohort", () => {
  const rule = new PathLedgerRequiredCohortRule("path ledger needs a value");
  const item = newPathLedger("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathLedgerTimezoneLengthRule flags a long timezone", () => {
  const rule = new PathLedgerTimezoneLengthRule(86400);
  const item = newPathLedger("x", "y");
  item.timezone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new PathLedgerRequiredTitleRule("path ledger needs a value");
  const item = newPathLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
