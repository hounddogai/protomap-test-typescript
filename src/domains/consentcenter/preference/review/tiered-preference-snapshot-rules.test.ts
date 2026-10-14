import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPreferenceSnapshotBidRangeRule,
  TieredPreferenceSnapshotNameLengthRule,
  TieredPreferenceSnapshotRequiredCodeRule,
  TieredPreferenceSnapshotUnitLengthRule,
  defaultTieredPreferenceSnapshotValidator,
} from "./tiered-preference-snapshot-rules.js";
import { newTieredPreferenceSnapshot } from "./tiered-preference-snapshot.js";

test("TieredPreferenceSnapshotValidator reports every problem", () => {
  const validator = defaultTieredPreferenceSnapshotValidator();
  const item = newTieredPreferenceSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPreferenceSnapshotNameLengthRule flags a long name", () => {
  const rule = new TieredPreferenceSnapshotNameLengthRule(255);
  const item = newTieredPreferenceSnapshot("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPreferenceSnapshotBidRangeRule flags values above bid", () => {
  const rule = new TieredPreferenceSnapshotBidRangeRule(7.4, 2685.9);
  const item = newTieredPreferenceSnapshot("x", "y");
  item.bid = 2687.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPreferenceSnapshotUnitLengthRule flags a long unit", () => {
  const rule = new TieredPreferenceSnapshotUnitLengthRule(120);
  const item = newTieredPreferenceSnapshot("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPreferenceSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new TieredPreferenceSnapshotRequiredCodeRule("tiered preference snapshot needs an entry");
  const item = newTieredPreferenceSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
