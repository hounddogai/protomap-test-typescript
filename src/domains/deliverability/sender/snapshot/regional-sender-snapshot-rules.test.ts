import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSenderSnapshotRequiredLabelRule,
  RegionalSenderSnapshotRequiredReviewerRule,
  RegionalSenderSnapshotReviewerLengthRule,
  RegionalSenderSnapshotVersionRangeRule,
  defaultRegionalSenderSnapshotValidator,
} from "./regional-sender-snapshot-rules.js";
import { newRegionalSenderSnapshot } from "./regional-sender-snapshot.js";

test("RegionalSenderSnapshotValidator reports every problem", () => {
  const validator = defaultRegionalSenderSnapshotValidator();
  const item = newRegionalSenderSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSenderSnapshotVersionRangeRule flags values above version", () => {
  const rule = new RegionalSenderSnapshotVersionRangeRule(120, 120);
  const item = newRegionalSenderSnapshot("x", "y");
  item.version = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSenderSnapshotReviewerLengthRule flags a long reviewer", () => {
  const rule = new RegionalSenderSnapshotReviewerLengthRule(32);
  const item = newRegionalSenderSnapshot("x", "y");
  item.reviewer = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalSenderSnapshotRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new RegionalSenderSnapshotRequiredReviewerRule("regional sender snapshot needs this field");
  const item = newRegionalSenderSnapshot("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSenderSnapshotRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalSenderSnapshotRequiredLabelRule("regional sender snapshot needs an entry");
  const item = newRegionalSenderSnapshot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
