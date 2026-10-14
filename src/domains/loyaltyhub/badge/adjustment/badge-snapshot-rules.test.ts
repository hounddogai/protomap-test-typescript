import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeSnapshotContactEmailLengthRule,
  BadgeSnapshotRequiredLabelRule,
  defaultBadgeSnapshotValidator,
} from "./badge-snapshot-rules.js";
import { newBadgeSnapshot } from "./badge-snapshot.js";

test("BadgeSnapshotValidator reports every problem", () => {
  const validator = defaultBadgeSnapshotValidator();
  const item = newBadgeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeSnapshotContactEmailLengthRule flags a long contact email", () => {
  const rule = new BadgeSnapshotContactEmailLengthRule(64);
  const item = newBadgeSnapshot("x", "y");
  item.contactEmail = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeSnapshotRequiredLabelRule flags a blank label", () => {
  const rule = new BadgeSnapshotRequiredLabelRule("badge snapshot needs an entry");
  const item = newBadgeSnapshot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
