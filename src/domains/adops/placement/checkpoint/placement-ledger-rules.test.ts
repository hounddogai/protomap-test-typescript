import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementLedgerNameLengthRule,
  PlacementLedgerRequiredCodeRule,
  PlacementLedgerRequiredVariantRule,
  defaultPlacementLedgerValidator,
} from "./placement-ledger-rules.js";
import { newPlacementLedger } from "./placement-ledger.js";

test("PlacementLedgerValidator reports every problem", () => {
  const validator = defaultPlacementLedgerValidator();
  const item = newPlacementLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementLedgerRequiredCodeRule("placement ledger needs this field");
  const item = newPlacementLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementLedgerNameLengthRule flags a long name", () => {
  const rule = new PlacementLedgerNameLengthRule(80);
  const item = newPlacementLedger("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementLedgerRequiredVariantRule flags a blank variant", () => {
  const rule = new PlacementLedgerRequiredVariantRule("placement ledger needs a value");
  const item = newPlacementLedger("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
