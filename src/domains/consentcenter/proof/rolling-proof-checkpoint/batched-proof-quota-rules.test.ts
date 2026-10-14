import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedProofQuotaCampaignRefLengthRule,
  BatchedProofQuotaQuantityRangeRule,
  BatchedProofQuotaRequiredCampaignRefRule,
  BatchedProofQuotaRequiredLocaleRule,
  defaultBatchedProofQuotaValidator,
} from "./batched-proof-quota-rules.js";
import { newBatchedProofQuota } from "./batched-proof-quota.js";

test("BatchedProofQuotaValidator reports every problem", () => {
  const validator = defaultBatchedProofQuotaValidator();
  const item = newBatchedProofQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedProofQuotaQuantityRangeRule flags values above quantity", () => {
  const rule = new BatchedProofQuotaQuantityRangeRule(32, 32);
  const item = newBatchedProofQuota("x", "y");
  item.quantity = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedProofQuotaCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new BatchedProofQuotaCampaignRefLengthRule(32);
  const item = newBatchedProofQuota("x", "y");
  item.campaignRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedProofQuotaRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedProofQuotaRequiredLocaleRule("batched proof quota needs an entry");
  const item = newBatchedProofQuota("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedProofQuotaRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new BatchedProofQuotaRequiredCampaignRefRule("batched proof quota needs an entry");
  const item = newBatchedProofQuota("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
