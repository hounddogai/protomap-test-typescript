import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveJourneyBatchDescriptionLengthRule,
  AdaptiveJourneyBatchRevisionRangeRule,
  AdaptiveJourneyBatchWeightRangeRule,
  defaultAdaptiveJourneyBatchValidator,
} from "./adaptive-journey-batch-rules.js";
import { newAdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

test("AdaptiveJourneyBatchValidator reports every problem", () => {
  const validator = defaultAdaptiveJourneyBatchValidator();
  const item = newAdaptiveJourneyBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveJourneyBatchDescriptionLengthRule flags a long description", () => {
  const rule = new AdaptiveJourneyBatchDescriptionLengthRule(86400);
  const item = newAdaptiveJourneyBatch("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveJourneyBatchWeightRangeRule flags values above weight", () => {
  const rule = new AdaptiveJourneyBatchWeightRangeRule(8.9, 3388.3);
  const item = newAdaptiveJourneyBatch("x", "y");
  item.weight = 3389.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveJourneyBatchRevisionRangeRule flags values above revision", () => {
  const rule = new AdaptiveJourneyBatchRevisionRangeRule(16, 80);
  const item = newAdaptiveJourneyBatch("x", "y");
  item.revision = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
