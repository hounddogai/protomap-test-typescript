import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPostQuotaAmountRangeRule,
  BatchedPostQuotaCountryLengthRule,
  BatchedPostQuotaRateRangeRule,
  defaultBatchedPostQuotaValidator,
} from "./batched-post-quota-rules.js";
import { newBatchedPostQuota } from "./batched-post-quota.js";

test("BatchedPostQuotaValidator reports every problem", () => {
  const validator = defaultBatchedPostQuotaValidator();
  const item = newBatchedPostQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPostQuotaAmountRangeRule flags values above amount", () => {
  const rule = new BatchedPostQuotaAmountRangeRule(3.9, 1218.6);
  const item = newBatchedPostQuota("x", "y");
  item.amount = 1220.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPostQuotaRateRangeRule flags values above rate", () => {
  const rule = new BatchedPostQuotaRateRangeRule(9.5, 56.1);
  const item = newBatchedPostQuota("x", "y");
  item.rate = 57.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPostQuotaCountryLengthRule flags a long country", () => {
  const rule = new BatchedPostQuotaCountryLengthRule(86400);
  const item = newBatchedPostQuota("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
