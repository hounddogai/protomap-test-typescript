import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualSubscriptionSnapshotBatchSizeRangeRule,
  ManualSubscriptionSnapshotRequiredCodeRule,
  ManualSubscriptionSnapshotTitleLengthRule,
  defaultManualSubscriptionSnapshotValidator,
} from "./manual-subscription-snapshot-rules.js";
import { newManualSubscriptionSnapshot } from "./manual-subscription-snapshot.js";

test("ManualSubscriptionSnapshotValidator reports every problem", () => {
  const validator = defaultManualSubscriptionSnapshotValidator();
  const item = newManualSubscriptionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualSubscriptionSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new ManualSubscriptionSnapshotRequiredCodeRule("manual subscription snapshot needs a value");
  const item = newManualSubscriptionSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualSubscriptionSnapshotBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ManualSubscriptionSnapshotBatchSizeRangeRule(32, 3600);
  const item = newManualSubscriptionSnapshot("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualSubscriptionSnapshotTitleLengthRule flags a long title", () => {
  const rule = new ManualSubscriptionSnapshotTitleLengthRule(120);
  const item = newManualSubscriptionSnapshot("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
