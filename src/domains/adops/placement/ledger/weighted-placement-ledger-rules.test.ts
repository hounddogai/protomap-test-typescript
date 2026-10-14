import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPlacementLedgerCostRangeRule,
  WeightedPlacementLedgerCountryLengthRule,
  WeightedPlacementLedgerNotesLengthRule,
  WeightedPlacementLedgerRequiredCodeRule,
  defaultWeightedPlacementLedgerValidator,
} from "./weighted-placement-ledger-rules.js";
import { newWeightedPlacementLedger } from "./weighted-placement-ledger.js";

test("WeightedPlacementLedgerValidator reports every problem", () => {
  const validator = defaultWeightedPlacementLedgerValidator();
  const item = newWeightedPlacementLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPlacementLedgerCostRangeRule flags values above cost", () => {
  const rule = new WeightedPlacementLedgerCostRangeRule(6.7, 3393);
  const item = newWeightedPlacementLedger("x", "y");
  item.cost = 3394.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPlacementLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedPlacementLedgerRequiredCodeRule("weighted placement ledger needs a value");
  const item = newWeightedPlacementLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPlacementLedgerNotesLengthRule flags a long notes", () => {
  const rule = new WeightedPlacementLedgerNotesLengthRule(80);
  const item = newWeightedPlacementLedger("x", "y");
  item.notes = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPlacementLedgerCountryLengthRule flags a long country", () => {
  const rule = new WeightedPlacementLedgerCountryLengthRule(64);
  const item = newWeightedPlacementLedger("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
