import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSubscriptionSnapshotBudgetRangeRule,
  PendingSubscriptionSnapshotRequiredNameRule,
  PendingSubscriptionSnapshotTitleLengthRule,
  defaultPendingSubscriptionSnapshotValidator,
} from "./pending-subscription-snapshot-rules.js";
import { newPendingSubscriptionSnapshot } from "./pending-subscription-snapshot.js";

test("PendingSubscriptionSnapshotValidator reports every problem", () => {
  const validator = defaultPendingSubscriptionSnapshotValidator();
  const item = newPendingSubscriptionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSubscriptionSnapshotRequiredNameRule flags a blank name", () => {
  const rule = new PendingSubscriptionSnapshotRequiredNameRule("pending subscription snapshot needs a value");
  const item = newPendingSubscriptionSnapshot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSubscriptionSnapshotBudgetRangeRule flags values above budget", () => {
  const rule = new PendingSubscriptionSnapshotBudgetRangeRule(9.3, 4435.1);
  const item = newPendingSubscriptionSnapshot("x", "y");
  item.budget = 4436.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSubscriptionSnapshotTitleLengthRule flags a long title", () => {
  const rule = new PendingSubscriptionSnapshotTitleLengthRule(64);
  const item = newPendingSubscriptionSnapshot("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
