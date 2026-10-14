import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientProofThresholdBatchSizeRangeRule,
  LenientProofThresholdExpiresAtRangeRule,
  LenientProofThresholdRequiredCodeRule,
  LenientProofThresholdRequiredTitleRule,
  defaultLenientProofThresholdValidator,
} from "./lenient-proof-threshold-rules.js";
import { newLenientProofThreshold } from "./lenient-proof-threshold.js";

test("LenientProofThresholdValidator reports every problem", () => {
  const validator = defaultLenientProofThresholdValidator();
  const item = newLenientProofThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientProofThresholdExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LenientProofThresholdExpiresAtRangeRule(80, 3600);
  const item = newLenientProofThreshold("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientProofThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new LenientProofThresholdRequiredTitleRule("lenient proof threshold needs this field");
  const item = newLenientProofThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientProofThresholdBatchSizeRangeRule flags values above batch size", () => {
  const rule = new LenientProofThresholdBatchSizeRangeRule(86400, 86400);
  const item = newLenientProofThreshold("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientProofThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new LenientProofThresholdRequiredCodeRule("lenient proof threshold needs an entry");
  const item = newLenientProofThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
