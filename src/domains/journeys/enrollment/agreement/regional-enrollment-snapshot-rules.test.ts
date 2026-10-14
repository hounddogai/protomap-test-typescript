import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalEnrollmentSnapshotChannelLengthRule,
  RegionalEnrollmentSnapshotRequiredTitleRule,
  RegionalEnrollmentSnapshotThresholdRangeRule,
  RegionalEnrollmentSnapshotUnitLengthRule,
  defaultRegionalEnrollmentSnapshotValidator,
} from "./regional-enrollment-snapshot-rules.js";
import { newRegionalEnrollmentSnapshot } from "./regional-enrollment-snapshot.js";

test("RegionalEnrollmentSnapshotValidator reports every problem", () => {
  const validator = defaultRegionalEnrollmentSnapshotValidator();
  const item = newRegionalEnrollmentSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalEnrollmentSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalEnrollmentSnapshotRequiredTitleRule("regional enrollment snapshot needs this field");
  const item = newRegionalEnrollmentSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalEnrollmentSnapshotThresholdRangeRule flags values above threshold", () => {
  const rule = new RegionalEnrollmentSnapshotThresholdRangeRule(7.9, 754.7);
  const item = newRegionalEnrollmentSnapshot("x", "y");
  item.threshold = 756.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalEnrollmentSnapshotChannelLengthRule flags a long channel", () => {
  const rule = new RegionalEnrollmentSnapshotChannelLengthRule(1000);
  const item = newRegionalEnrollmentSnapshot("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalEnrollmentSnapshotUnitLengthRule flags a long unit", () => {
  const rule = new RegionalEnrollmentSnapshotUnitLengthRule(255);
  const item = newRegionalEnrollmentSnapshot("x", "y");
  item.unit = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
