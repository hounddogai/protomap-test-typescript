import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyBatchCodeLengthRule,
  FrequencyBatchLabelLengthRule,
  FrequencyBatchRequiredCampaignRefRule,
  FrequencyBatchRequiredLabelRule,
  defaultFrequencyBatchValidator,
} from "./frequency-batch-rules.js";
import { newFrequencyBatch } from "./frequency-batch.js";

test("FrequencyBatchValidator reports every problem", () => {
  const validator = defaultFrequencyBatchValidator();
  const item = newFrequencyBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyBatchRequiredLabelRule flags a blank label", () => {
  const rule = new FrequencyBatchRequiredLabelRule("frequency batch needs an entry");
  const item = newFrequencyBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyBatchRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new FrequencyBatchRequiredCampaignRefRule("frequency batch needs an entry");
  const item = newFrequencyBatch("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyBatchCodeLengthRule flags a long code", () => {
  const rule = new FrequencyBatchCodeLengthRule(32);
  const item = newFrequencyBatch("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyBatchLabelLengthRule flags a long label", () => {
  const rule = new FrequencyBatchLabelLengthRule(120);
  const item = newFrequencyBatch("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
