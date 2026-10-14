import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredReputationRecordAmountRangeRule,
  TieredReputationRecordRequiredUnitRule,
  TieredReputationRecordSourceLengthRule,
  defaultTieredReputationRecordValidator,
} from "./tiered-reputation-record-rules.js";
import { newTieredReputationRecord } from "./tiered-reputation-record.js";

test("TieredReputationRecordValidator reports every problem", () => {
  const validator = defaultTieredReputationRecordValidator();
  const item = newTieredReputationRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredReputationRecordAmountRangeRule flags values above amount", () => {
  const rule = new TieredReputationRecordAmountRangeRule(6.2, 1581.8);
  const item = newTieredReputationRecord("x", "y");
  item.amount = 1583.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredReputationRecordRequiredUnitRule flags a blank unit", () => {
  const rule = new TieredReputationRecordRequiredUnitRule("tiered reputation record needs this field");
  const item = newTieredReputationRecord("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredReputationRecordSourceLengthRule flags a long source", () => {
  const rule = new TieredReputationRecordSourceLengthRule(32);
  const item = newTieredReputationRecord("x", "y");
  item.source = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
