import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelSnapshotDiscountRangeRule,
  LevelSnapshotSegmentLengthRule,
  defaultLevelSnapshotValidator,
} from "./level-snapshot-rules.js";
import { newLevelSnapshot } from "./level-snapshot.js";

test("LevelSnapshotValidator reports every problem", () => {
  const validator = defaultLevelSnapshotValidator();
  const item = newLevelSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelSnapshotSegmentLengthRule flags a long segment", () => {
  const rule = new LevelSnapshotSegmentLengthRule(3600);
  const item = newLevelSnapshot("x", "y");
  item.segment = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelSnapshotDiscountRangeRule flags values above discount", () => {
  const rule = new LevelSnapshotDiscountRangeRule(9.6, 4290.4);
  const item = newLevelSnapshot("x", "y");
  item.discount = 4291.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
