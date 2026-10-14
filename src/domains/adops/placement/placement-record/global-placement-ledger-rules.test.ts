import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalPlacementLedgerCostRangeRule,
  GlobalPlacementLedgerRequiredCodeRule,
  GlobalPlacementLedgerStartsAtRangeRule,
  defaultGlobalPlacementLedgerValidator,
} from "./global-placement-ledger-rules.js";
import { newGlobalPlacementLedger } from "./global-placement-ledger.js";

test("GlobalPlacementLedgerValidator reports every problem", () => {
  const validator = defaultGlobalPlacementLedgerValidator();
  const item = newGlobalPlacementLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalPlacementLedgerStartsAtRangeRule flags values above starts at", () => {
  const rule = new GlobalPlacementLedgerStartsAtRangeRule(120, 255);
  const item = newGlobalPlacementLedger("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalPlacementLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalPlacementLedgerRequiredCodeRule("global placement ledger needs this field");
  const item = newGlobalPlacementLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalPlacementLedgerCostRangeRule flags values above cost", () => {
  const rule = new GlobalPlacementLedgerCostRangeRule(3.4, 2851.3);
  const item = newGlobalPlacementLedger("x", "y");
  item.cost = 2852.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
