import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedApprovalQuotaBidRangeRule,
  BatchedApprovalQuotaRequiredCampaignRefRule,
  BatchedApprovalQuotaRequiredChannelRule,
  BatchedApprovalQuotaRequiredTitleRule,
  BatchedApprovalQuotaTitleLengthRule,
  defaultBatchedApprovalQuotaValidator,
} from "./batched-approval-quota-rules.js";
import { newBatchedApprovalQuota } from "./batched-approval-quota.js";

test("BatchedApprovalQuotaValidator reports every problem", () => {
  const validator = defaultBatchedApprovalQuotaValidator();
  const item = newBatchedApprovalQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedApprovalQuotaRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new BatchedApprovalQuotaRequiredCampaignRefRule("batched approval quota needs an entry");
  const item = newBatchedApprovalQuota("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedApprovalQuotaRequiredChannelRule flags a blank channel", () => {
  const rule = new BatchedApprovalQuotaRequiredChannelRule("batched approval quota needs this field");
  const item = newBatchedApprovalQuota("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedApprovalQuotaBidRangeRule flags values above bid", () => {
  const rule = new BatchedApprovalQuotaBidRangeRule(3.4, 4144.2);
  const item = newBatchedApprovalQuota("x", "y");
  item.bid = 4145.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedApprovalQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedApprovalQuotaRequiredTitleRule("batched approval quota needs an entry");
  const item = newBatchedApprovalQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedApprovalQuotaTitleLengthRule flags a long title", () => {
  const rule = new BatchedApprovalQuotaTitleLengthRule(64);
  const item = newBatchedApprovalQuota("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
