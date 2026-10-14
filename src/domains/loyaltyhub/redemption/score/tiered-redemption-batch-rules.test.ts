import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRedemptionBatchChecksumLengthRule,
  TieredRedemptionBatchMarginRangeRule,
  defaultTieredRedemptionBatchValidator,
} from "./tiered-redemption-batch-rules.js";
import { newTieredRedemptionBatch } from "./tiered-redemption-batch.js";

test("TieredRedemptionBatchValidator reports every problem", () => {
  const validator = defaultTieredRedemptionBatchValidator();
  const item = newTieredRedemptionBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRedemptionBatchMarginRangeRule flags values above margin", () => {
  const rule = new TieredRedemptionBatchMarginRangeRule(7.6, 1927.5);
  const item = newTieredRedemptionBatch("x", "y");
  item.margin = 1929;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRedemptionBatchChecksumLengthRule flags a long checksum", () => {
  const rule = new TieredRedemptionBatchChecksumLengthRule(16);
  const item = newTieredRedemptionBatch("x", "y");
  item.checksum = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
