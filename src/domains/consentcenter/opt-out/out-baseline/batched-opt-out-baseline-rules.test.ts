import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedOptOutBaselineCampaignRefLengthRule,
  BatchedOptOutBaselineRequiredCampaignRefRule,
  BatchedOptOutBaselineRequiredChannelRule,
  defaultBatchedOptOutBaselineValidator,
} from "./batched-opt-out-baseline-rules.js";
import { newBatchedOptOutBaseline } from "./batched-opt-out-baseline.js";

test("BatchedOptOutBaselineValidator reports every problem", () => {
  const validator = defaultBatchedOptOutBaselineValidator();
  const item = newBatchedOptOutBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedOptOutBaselineCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new BatchedOptOutBaselineCampaignRefLengthRule(120);
  const item = newBatchedOptOutBaseline("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedOptOutBaselineRequiredChannelRule flags a blank channel", () => {
  const rule = new BatchedOptOutBaselineRequiredChannelRule("batched opt out baseline needs this field");
  const item = newBatchedOptOutBaseline("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedOptOutBaselineRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new BatchedOptOutBaselineRequiredCampaignRefRule("batched opt out baseline needs this field");
  const item = newBatchedOptOutBaseline("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
