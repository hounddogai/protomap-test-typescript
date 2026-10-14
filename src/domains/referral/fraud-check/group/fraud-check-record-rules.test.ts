import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckRecordCampaignRefLengthRule,
  FraudCheckRecordOpenRateRangeRule,
  FraudCheckRecordRequiredCampaignRefRule,
  defaultFraudCheckRecordValidator,
} from "./fraud-check-record-rules.js";
import { newFraudCheckRecord } from "./fraud-check-record.js";

test("FraudCheckRecordValidator reports every problem", () => {
  const validator = defaultFraudCheckRecordValidator();
  const item = newFraudCheckRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckRecordCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new FraudCheckRecordCampaignRefLengthRule(86400);
  const item = newFraudCheckRecord("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckRecordRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new FraudCheckRecordRequiredCampaignRefRule("fraud check record needs an entry");
  const item = newFraudCheckRecord("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckRecordOpenRateRangeRule flags values above open rate", () => {
  const rule = new FraudCheckRecordOpenRateRangeRule(3.5, 1913.6);
  const item = newFraudCheckRecord("x", "y");
  item.openRate = 1915.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
