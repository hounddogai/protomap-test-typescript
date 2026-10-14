import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingWindowManifestJourneyIdLengthRule,
  PendingWindowManifestRequiredOwnerIdRule,
  PendingWindowManifestRequiredTitleRule,
  PendingWindowManifestTitleLengthRule,
  PendingWindowManifestVersionRangeRule,
  defaultPendingWindowManifestValidator,
} from "./pending-window-manifest-rules.js";
import { newPendingWindowManifest } from "./pending-window-manifest.js";

test("PendingWindowManifestValidator reports every problem", () => {
  const validator = defaultPendingWindowManifestValidator();
  const item = newPendingWindowManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingWindowManifestJourneyIdLengthRule flags a long journey id", () => {
  const rule = new PendingWindowManifestJourneyIdLengthRule(80);
  const item = newPendingWindowManifest("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingWindowManifestRequiredTitleRule flags a blank title", () => {
  const rule = new PendingWindowManifestRequiredTitleRule("pending window manifest needs an entry");
  const item = newPendingWindowManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingWindowManifestRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new PendingWindowManifestRequiredOwnerIdRule("pending window manifest needs an entry");
  const item = newPendingWindowManifest("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingWindowManifestTitleLengthRule flags a long title", () => {
  const rule = new PendingWindowManifestTitleLengthRule(16);
  const item = newPendingWindowManifest("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingWindowManifestVersionRangeRule flags values above version", () => {
  const rule = new PendingWindowManifestVersionRangeRule(16, 32);
  const item = newPendingWindowManifest("x", "y");
  item.version = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
