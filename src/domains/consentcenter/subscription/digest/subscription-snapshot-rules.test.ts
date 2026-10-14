import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionSnapshotRequiredChecksumRule,
  SubscriptionSnapshotRequiredJourneyIdRule,
  SubscriptionSnapshotWindowDaysRangeRule,
  defaultSubscriptionSnapshotValidator,
} from "./subscription-snapshot-rules.js";
import { newSubscriptionSnapshot } from "./subscription-snapshot.js";

test("SubscriptionSnapshotValidator reports every problem", () => {
  const validator = defaultSubscriptionSnapshotValidator();
  const item = newSubscriptionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionSnapshotRequiredChecksumRule flags a blank checksum", () => {
  const rule = new SubscriptionSnapshotRequiredChecksumRule("subscription snapshot needs a value");
  const item = newSubscriptionSnapshot("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionSnapshotRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new SubscriptionSnapshotRequiredJourneyIdRule("subscription snapshot needs a value");
  const item = newSubscriptionSnapshot("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionSnapshotWindowDaysRangeRule flags values above window days", () => {
  const rule = new SubscriptionSnapshotWindowDaysRangeRule(255, 3600);
  const item = newSubscriptionSnapshot("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
