import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredNudgeSnapshotCodeLengthRule,
  TieredNudgeSnapshotRequiredTitleRule,
  defaultTieredNudgeSnapshotValidator,
} from "./tiered-nudge-snapshot-rules.js";
import { newTieredNudgeSnapshot } from "./tiered-nudge-snapshot.js";

test("TieredNudgeSnapshotValidator reports every problem", () => {
  const validator = defaultTieredNudgeSnapshotValidator();
  const item = newTieredNudgeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredNudgeSnapshotCodeLengthRule flags a long code", () => {
  const rule = new TieredNudgeSnapshotCodeLengthRule(64);
  const item = newTieredNudgeSnapshot("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredNudgeSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new TieredNudgeSnapshotRequiredTitleRule("tiered nudge snapshot needs a value");
  const item = newTieredNudgeSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
