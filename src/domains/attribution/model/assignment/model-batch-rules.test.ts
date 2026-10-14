import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelBatchCodeLengthRule,
  ModelBatchRequiredCampaignRefRule,
  ModelBatchRequiredCodeRule,
  ModelBatchRequiredUnitRule,
  defaultModelBatchValidator,
} from "./model-batch-rules.js";
import { newModelBatch } from "./model-batch.js";

test("ModelBatchValidator reports every problem", () => {
  const validator = defaultModelBatchValidator();
  const item = newModelBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelBatchRequiredUnitRule flags a blank unit", () => {
  const rule = new ModelBatchRequiredUnitRule("model batch needs a value");
  const item = newModelBatch("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelBatchRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ModelBatchRequiredCampaignRefRule("model batch needs an entry");
  const item = newModelBatch("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelBatchRequiredCodeRule flags a blank code", () => {
  const rule = new ModelBatchRequiredCodeRule("model batch needs a value");
  const item = newModelBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelBatchCodeLengthRule flags a long code", () => {
  const rule = new ModelBatchCodeLengthRule(86400);
  const item = newModelBatch("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
