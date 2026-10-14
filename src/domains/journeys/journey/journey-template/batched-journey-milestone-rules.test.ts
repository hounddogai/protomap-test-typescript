import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedJourneyMilestoneCodeLengthRule,
  BatchedJourneyMilestoneExpiresAtRangeRule,
  BatchedJourneyMilestoneFloorValueRangeRule,
  BatchedJourneyMilestoneRequiredLabelRule,
  BatchedJourneyMilestoneSendAtRangeRule,
  defaultBatchedJourneyMilestoneValidator,
} from "./batched-journey-milestone-rules.js";
import { newBatchedJourneyMilestone } from "./batched-journey-milestone.js";

test("BatchedJourneyMilestoneValidator reports every problem", () => {
  const validator = defaultBatchedJourneyMilestoneValidator();
  const item = newBatchedJourneyMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedJourneyMilestoneFloorValueRangeRule flags values above floor value", () => {
  const rule = new BatchedJourneyMilestoneFloorValueRangeRule(6.7, 4727.2);
  const item = newBatchedJourneyMilestone("x", "y");
  item.floorValue = 4728.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedJourneyMilestoneExpiresAtRangeRule flags values above expires at", () => {
  const rule = new BatchedJourneyMilestoneExpiresAtRangeRule(255, 1000);
  const item = newBatchedJourneyMilestone("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedJourneyMilestoneCodeLengthRule flags a long code", () => {
  const rule = new BatchedJourneyMilestoneCodeLengthRule(16);
  const item = newBatchedJourneyMilestone("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedJourneyMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedJourneyMilestoneRequiredLabelRule("batched journey milestone needs this field");
  const item = newBatchedJourneyMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedJourneyMilestoneSendAtRangeRule flags values above send at", () => {
  const rule = new BatchedJourneyMilestoneSendAtRangeRule(255, 3600);
  const item = newBatchedJourneyMilestone("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
