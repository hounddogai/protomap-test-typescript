import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredMacroSnapshotRequiredCodeRule,
  TieredMacroSnapshotScoreRangeRule,
  defaultTieredMacroSnapshotValidator,
} from "./tiered-macro-snapshot-rules.js";
import { newTieredMacroSnapshot } from "./tiered-macro-snapshot.js";

test("TieredMacroSnapshotValidator reports every problem", () => {
  const validator = defaultTieredMacroSnapshotValidator();
  const item = newTieredMacroSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredMacroSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new TieredMacroSnapshotRequiredCodeRule("tiered macro snapshot needs this field");
  const item = newTieredMacroSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredMacroSnapshotScoreRangeRule flags values above score", () => {
  const rule = new TieredMacroSnapshotScoreRangeRule(5.6, 1871.4);
  const item = newTieredMacroSnapshot("x", "y");
  item.score = 1872.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
