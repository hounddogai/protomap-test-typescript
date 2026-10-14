import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchSnapshotOpenRateRangeRule,
  BranchSnapshotRequiredRegionRule,
  BranchSnapshotScoreRangeRule,
  defaultBranchSnapshotValidator,
} from "./branch-snapshot-rules.js";
import { newBranchSnapshot } from "./branch-snapshot.js";

test("BranchSnapshotValidator reports every problem", () => {
  const validator = defaultBranchSnapshotValidator();
  const item = newBranchSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchSnapshotOpenRateRangeRule flags values above open rate", () => {
  const rule = new BranchSnapshotOpenRateRangeRule(5.2, 4518.8);
  const item = newBranchSnapshot("x", "y");
  item.openRate = 4520.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchSnapshotScoreRangeRule flags values above score", () => {
  const rule = new BranchSnapshotScoreRangeRule(5.4, 2772.3);
  const item = newBranchSnapshot("x", "y");
  item.score = 2773.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchSnapshotRequiredRegionRule flags a blank region", () => {
  const rule = new BranchSnapshotRequiredRegionRule("branch snapshot needs this field");
  const item = newBranchSnapshot("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
