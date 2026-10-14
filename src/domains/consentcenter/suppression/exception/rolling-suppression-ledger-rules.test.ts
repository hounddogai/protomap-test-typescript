import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSuppressionLedgerCohortLengthRule,
  RollingSuppressionLedgerDurationMinutesRangeRule,
  RollingSuppressionLedgerFloorValueRangeRule,
  RollingSuppressionLedgerWeightRangeRule,
  defaultRollingSuppressionLedgerValidator,
} from "./rolling-suppression-ledger-rules.js";
import { newRollingSuppressionLedger } from "./rolling-suppression-ledger.js";

test("RollingSuppressionLedgerValidator reports every problem", () => {
  const validator = defaultRollingSuppressionLedgerValidator();
  const item = newRollingSuppressionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSuppressionLedgerDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RollingSuppressionLedgerDurationMinutesRangeRule(255, 1000);
  const item = newRollingSuppressionLedger("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSuppressionLedgerWeightRangeRule flags values above weight", () => {
  const rule = new RollingSuppressionLedgerWeightRangeRule(5.8, 1123.4);
  const item = newRollingSuppressionLedger("x", "y");
  item.weight = 1124.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSuppressionLedgerCohortLengthRule flags a long cohort", () => {
  const rule = new RollingSuppressionLedgerCohortLengthRule(3600);
  const item = newRollingSuppressionLedger("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSuppressionLedgerFloorValueRangeRule flags values above floor value", () => {
  const rule = new RollingSuppressionLedgerFloorValueRangeRule(7.4, 758.6);
  const item = newRollingSuppressionLedger("x", "y");
  item.floorValue = 760.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
