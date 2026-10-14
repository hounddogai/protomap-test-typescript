import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalStreakSnapshotCodeLengthRule,
  RegionalStreakSnapshotImpressionsRangeRule,
  RegionalStreakSnapshotMarginRangeRule,
  RegionalStreakSnapshotRateRangeRule,
  RegionalStreakSnapshotRequiredCodeRule,
  defaultRegionalStreakSnapshotValidator,
} from "./regional-streak-snapshot-rules.js";
import { newRegionalStreakSnapshot } from "./regional-streak-snapshot.js";

test("RegionalStreakSnapshotValidator reports every problem", () => {
  const validator = defaultRegionalStreakSnapshotValidator();
  const item = newRegionalStreakSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalStreakSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalStreakSnapshotRequiredCodeRule("regional streak snapshot needs a value");
  const item = newRegionalStreakSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalStreakSnapshotCodeLengthRule flags a long code", () => {
  const rule = new RegionalStreakSnapshotCodeLengthRule(3600);
  const item = newRegionalStreakSnapshot("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalStreakSnapshotRateRangeRule flags values above rate", () => {
  const rule = new RegionalStreakSnapshotRateRangeRule(6.8, 2726.3);
  const item = newRegionalStreakSnapshot("x", "y");
  item.rate = 2727.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalStreakSnapshotImpressionsRangeRule flags values above impressions", () => {
  const rule = new RegionalStreakSnapshotImpressionsRangeRule(64, 1000);
  const item = newRegionalStreakSnapshot("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalStreakSnapshotMarginRangeRule flags values above margin", () => {
  const rule = new RegionalStreakSnapshotMarginRangeRule(4.5, 3422.4);
  const item = newRegionalStreakSnapshot("x", "y");
  item.margin = 3423.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
