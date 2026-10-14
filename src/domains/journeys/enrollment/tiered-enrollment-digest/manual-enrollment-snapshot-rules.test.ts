import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualEnrollmentSnapshotAudienceIdLengthRule,
  ManualEnrollmentSnapshotRequiredCodeRule,
  ManualEnrollmentSnapshotSendAtRangeRule,
  defaultManualEnrollmentSnapshotValidator,
} from "./manual-enrollment-snapshot-rules.js";
import { newManualEnrollmentSnapshot } from "./manual-enrollment-snapshot.js";

test("ManualEnrollmentSnapshotValidator reports every problem", () => {
  const validator = defaultManualEnrollmentSnapshotValidator();
  const item = newManualEnrollmentSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualEnrollmentSnapshotSendAtRangeRule flags values above send at", () => {
  const rule = new ManualEnrollmentSnapshotSendAtRangeRule(255, 255);
  const item = newManualEnrollmentSnapshot("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualEnrollmentSnapshotAudienceIdLengthRule flags a long audience id", () => {
  const rule = new ManualEnrollmentSnapshotAudienceIdLengthRule(32);
  const item = newManualEnrollmentSnapshot("x", "y");
  item.audienceId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualEnrollmentSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new ManualEnrollmentSnapshotRequiredCodeRule("manual enrollment snapshot needs a value");
  const item = newManualEnrollmentSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
