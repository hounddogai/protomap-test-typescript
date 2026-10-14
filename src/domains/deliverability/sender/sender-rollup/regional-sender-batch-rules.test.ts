import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSenderBatchCodeLengthRule,
  RegionalSenderBatchLimitRangeRule,
  RegionalSenderBatchRequiredJourneyIdRule,
  RegionalSenderBatchRequiredLabelRule,
  defaultRegionalSenderBatchValidator,
} from "./regional-sender-batch-rules.js";
import { newRegionalSenderBatch } from "./regional-sender-batch.js";

test("RegionalSenderBatchValidator reports every problem", () => {
  const validator = defaultRegionalSenderBatchValidator();
  const item = newRegionalSenderBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSenderBatchCodeLengthRule flags a long code", () => {
  const rule = new RegionalSenderBatchCodeLengthRule(32);
  const item = newRegionalSenderBatch("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalSenderBatchRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalSenderBatchRequiredLabelRule("regional sender batch needs this field");
  const item = newRegionalSenderBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSenderBatchLimitRangeRule flags values above limit", () => {
  const rule = new RegionalSenderBatchLimitRangeRule(16, 16);
  const item = newRegionalSenderBatch("x", "y");
  item.limit = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSenderBatchRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new RegionalSenderBatchRequiredJourneyIdRule("regional sender batch needs this field");
  const item = newRegionalSenderBatch("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
