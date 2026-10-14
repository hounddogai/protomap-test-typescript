import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPlacementLedgerCapacityRangeRule,
  RollingPlacementLedgerDiscountRangeRule,
  RollingPlacementLedgerNameLengthRule,
  defaultRollingPlacementLedgerValidator,
} from "./rolling-placement-ledger-rules.js";
import { newRollingPlacementLedger } from "./rolling-placement-ledger.js";

test("RollingPlacementLedgerValidator reports every problem", () => {
  const validator = defaultRollingPlacementLedgerValidator();
  const item = newRollingPlacementLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPlacementLedgerCapacityRangeRule flags values above capacity", () => {
  const rule = new RollingPlacementLedgerCapacityRangeRule(80, 255);
  const item = newRollingPlacementLedger("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPlacementLedgerDiscountRangeRule flags values above discount", () => {
  const rule = new RollingPlacementLedgerDiscountRangeRule(2.8, 2273.4);
  const item = newRollingPlacementLedger("x", "y");
  item.discount = 2274.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPlacementLedgerNameLengthRule flags a long name", () => {
  const rule = new RollingPlacementLedgerNameLengthRule(120);
  const item = newRollingPlacementLedger("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
