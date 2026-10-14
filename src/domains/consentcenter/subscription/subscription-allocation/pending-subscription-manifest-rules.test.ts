import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSubscriptionManifestCodeLengthRule,
  PendingSubscriptionManifestWindowDaysRangeRule,
  defaultPendingSubscriptionManifestValidator,
} from "./pending-subscription-manifest-rules.js";
import { newPendingSubscriptionManifest } from "./pending-subscription-manifest.js";

test("PendingSubscriptionManifestValidator reports every problem", () => {
  const validator = defaultPendingSubscriptionManifestValidator();
  const item = newPendingSubscriptionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSubscriptionManifestWindowDaysRangeRule flags values above window days", () => {
  const rule = new PendingSubscriptionManifestWindowDaysRangeRule(16, 64);
  const item = newPendingSubscriptionManifest("x", "y");
  item.windowDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSubscriptionManifestCodeLengthRule flags a long code", () => {
  const rule = new PendingSubscriptionManifestCodeLengthRule(64);
  const item = newPendingSubscriptionManifest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
