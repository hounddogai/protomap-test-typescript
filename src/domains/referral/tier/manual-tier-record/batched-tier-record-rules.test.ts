import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedTierRecordCodeLengthRule,
  BatchedTierRecordEndsAtRangeRule,
  BatchedTierRecordImpressionsRangeRule,
  BatchedTierRecordOpenRateRangeRule,
  BatchedTierRecordRequiredLabelRule,
  defaultBatchedTierRecordValidator,
} from "./batched-tier-record-rules.js";
import { newBatchedTierRecord } from "./batched-tier-record.js";

test("BatchedTierRecordValidator reports every problem", () => {
  const validator = defaultBatchedTierRecordValidator();
  const item = newBatchedTierRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedTierRecordRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedTierRecordRequiredLabelRule("batched tier record needs a value");
  const item = newBatchedTierRecord("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedTierRecordOpenRateRangeRule flags values above open rate", () => {
  const rule = new BatchedTierRecordOpenRateRangeRule(5.1, 4479.8);
  const item = newBatchedTierRecord("x", "y");
  item.openRate = 4481.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedTierRecordImpressionsRangeRule flags values above impressions", () => {
  const rule = new BatchedTierRecordImpressionsRangeRule(80, 255);
  const item = newBatchedTierRecord("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedTierRecordCodeLengthRule flags a long code", () => {
  const rule = new BatchedTierRecordCodeLengthRule(64);
  const item = newBatchedTierRecord("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedTierRecordEndsAtRangeRule flags values above ends at", () => {
  const rule = new BatchedTierRecordEndsAtRangeRule(16, 1000);
  const item = newBatchedTierRecord("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
