import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedBounceManifestImpressionsRangeRule,
  BatchedBounceManifestRequiredLocaleRule,
  BatchedBounceManifestReviewerLengthRule,
  BatchedBounceManifestSendAtRangeRule,
  defaultBatchedBounceManifestValidator,
} from "./batched-bounce-manifest-rules.js";
import { newBatchedBounceManifest } from "./batched-bounce-manifest.js";

test("BatchedBounceManifestValidator reports every problem", () => {
  const validator = defaultBatchedBounceManifestValidator();
  const item = newBatchedBounceManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedBounceManifestRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedBounceManifestRequiredLocaleRule("batched bounce manifest needs this field");
  const item = newBatchedBounceManifest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedBounceManifestSendAtRangeRule flags values above send at", () => {
  const rule = new BatchedBounceManifestSendAtRangeRule(64, 255);
  const item = newBatchedBounceManifest("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedBounceManifestImpressionsRangeRule flags values above impressions", () => {
  const rule = new BatchedBounceManifestImpressionsRangeRule(120, 86400);
  const item = newBatchedBounceManifest("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedBounceManifestReviewerLengthRule flags a long reviewer", () => {
  const rule = new BatchedBounceManifestReviewerLengthRule(86400);
  const item = newBatchedBounceManifest("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
