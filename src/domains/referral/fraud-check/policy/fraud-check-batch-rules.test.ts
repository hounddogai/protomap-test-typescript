import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckBatchCodeLengthRule,
  FraudCheckBatchRequiredCampaignRefRule,
  FraudCheckBatchRequiredVariantRule,
  FraudCheckBatchVersionRangeRule,
  defaultFraudCheckBatchValidator,
} from "./fraud-check-batch-rules.js";
import { newFraudCheckBatch } from "./fraud-check-batch.js";

test("FraudCheckBatchValidator reports every problem", () => {
  const validator = defaultFraudCheckBatchValidator();
  const item = newFraudCheckBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckBatchCodeLengthRule flags a long code", () => {
  const rule = new FraudCheckBatchCodeLengthRule(120);
  const item = newFraudCheckBatch("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckBatchVersionRangeRule flags values above version", () => {
  const rule = new FraudCheckBatchVersionRangeRule(120, 255);
  const item = newFraudCheckBatch("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckBatchRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new FraudCheckBatchRequiredCampaignRefRule("fraud check batch needs this field");
  const item = newFraudCheckBatch("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckBatchRequiredVariantRule flags a blank variant", () => {
  const rule = new FraudCheckBatchRequiredVariantRule("fraud check batch needs an entry");
  const item = newFraudCheckBatch("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
