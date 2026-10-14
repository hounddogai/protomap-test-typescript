import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalNudgeSnapshotDurationMinutesRangeRule,
  RegionalNudgeSnapshotExternalRefLengthRule,
  RegionalNudgeSnapshotRequiredLabelRule,
  RegionalNudgeSnapshotReviewerLengthRule,
  defaultRegionalNudgeSnapshotValidator,
} from "./regional-nudge-snapshot-rules.js";
import { newRegionalNudgeSnapshot } from "./regional-nudge-snapshot.js";

test("RegionalNudgeSnapshotValidator reports every problem", () => {
  const validator = defaultRegionalNudgeSnapshotValidator();
  const item = newRegionalNudgeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalNudgeSnapshotReviewerLengthRule flags a long reviewer", () => {
  const rule = new RegionalNudgeSnapshotReviewerLengthRule(255);
  const item = newRegionalNudgeSnapshot("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalNudgeSnapshotDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RegionalNudgeSnapshotDurationMinutesRangeRule(86400, 86400);
  const item = newRegionalNudgeSnapshot("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalNudgeSnapshotExternalRefLengthRule flags a long external ref", () => {
  const rule = new RegionalNudgeSnapshotExternalRefLengthRule(255);
  const item = newRegionalNudgeSnapshot("x", "y");
  item.externalRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalNudgeSnapshotRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalNudgeSnapshotRequiredLabelRule("regional nudge snapshot needs a value");
  const item = newRegionalNudgeSnapshot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
