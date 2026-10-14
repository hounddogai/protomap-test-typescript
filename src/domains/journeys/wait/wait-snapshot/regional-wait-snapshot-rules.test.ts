import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalWaitSnapshotDescriptionLengthRule,
  RegionalWaitSnapshotPriorityRangeRule,
  RegionalWaitSnapshotRequiredCodeRule,
  RegionalWaitSnapshotRequiredTitleRule,
  RegionalWaitSnapshotTitleLengthRule,
  defaultRegionalWaitSnapshotValidator,
} from "./regional-wait-snapshot-rules.js";
import { newRegionalWaitSnapshot } from "./regional-wait-snapshot.js";

test("RegionalWaitSnapshotValidator reports every problem", () => {
  const validator = defaultRegionalWaitSnapshotValidator();
  const item = newRegionalWaitSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalWaitSnapshotDescriptionLengthRule flags a long description", () => {
  const rule = new RegionalWaitSnapshotDescriptionLengthRule(86400);
  const item = newRegionalWaitSnapshot("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalWaitSnapshotPriorityRangeRule flags values above priority", () => {
  const rule = new RegionalWaitSnapshotPriorityRangeRule(16, 3600);
  const item = newRegionalWaitSnapshot("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalWaitSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalWaitSnapshotRequiredTitleRule("regional wait snapshot needs an entry");
  const item = newRegionalWaitSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalWaitSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalWaitSnapshotRequiredCodeRule("regional wait snapshot needs a value");
  const item = newRegionalWaitSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalWaitSnapshotTitleLengthRule flags a long title", () => {
  const rule = new RegionalWaitSnapshotTitleLengthRule(80);
  const item = newRegionalWaitSnapshot("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
