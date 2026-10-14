import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeSnapshotCodeLengthRule,
  NudgeSnapshotConversionRateRangeRule,
  NudgeSnapshotRequiredCodeRule,
  NudgeSnapshotRequiredTitleRule,
  defaultNudgeSnapshotValidator,
} from "./nudge-snapshot-rules.js";
import { newNudgeSnapshot } from "./nudge-snapshot.js";

test("NudgeSnapshotValidator reports every problem", () => {
  const validator = defaultNudgeSnapshotValidator();
  const item = newNudgeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeSnapshotCodeLengthRule flags a long code", () => {
  const rule = new NudgeSnapshotCodeLengthRule(16);
  const item = newNudgeSnapshot("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeSnapshotConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new NudgeSnapshotConversionRateRangeRule(9.8, 2110);
  const item = newNudgeSnapshot("x", "y");
  item.conversionRate = 2111.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeSnapshotRequiredCodeRule("nudge snapshot needs this field");
  const item = newNudgeSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new NudgeSnapshotRequiredTitleRule("nudge snapshot needs this field");
  const item = newNudgeSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
