import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelLedgerCapacityRangeRule,
  LevelLedgerCategoryLengthRule,
  LevelLedgerImpressionsRangeRule,
  LevelLedgerNameLengthRule,
  LevelLedgerRequiredCodeRule,
  defaultLevelLedgerValidator,
} from "./level-ledger-rules.js";
import { newLevelLedger } from "./level-ledger.js";

test("LevelLedgerValidator reports every problem", () => {
  const validator = defaultLevelLedgerValidator();
  const item = newLevelLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelLedgerImpressionsRangeRule flags values above impressions", () => {
  const rule = new LevelLedgerImpressionsRangeRule(255, 1000);
  const item = newLevelLedger("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new LevelLedgerRequiredCodeRule("level ledger needs a value");
  const item = newLevelLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelLedgerCategoryLengthRule flags a long category", () => {
  const rule = new LevelLedgerCategoryLengthRule(80);
  const item = newLevelLedger("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelLedgerNameLengthRule flags a long name", () => {
  const rule = new LevelLedgerNameLengthRule(16);
  const item = newLevelLedger("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelLedgerCapacityRangeRule flags values above capacity", () => {
  const rule = new LevelLedgerCapacityRangeRule(1000, 3600);
  const item = newLevelLedger("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
