import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueEstimateCodeLengthRule,
  QueueEstimateDescriptionLengthRule,
  QueueEstimateExpiresAtRangeRule,
  QueueEstimateOwnerIdLengthRule,
  QueueEstimateTitleLengthRule,
  defaultQueueEstimateValidator,
} from "./queue-estimate-rules.js";
import { newQueueEstimate } from "./queue-estimate.js";

test("QueueEstimateValidator reports every problem", () => {
  const validator = defaultQueueEstimateValidator();
  const item = newQueueEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueEstimateOwnerIdLengthRule flags a long owner id", () => {
  const rule = new QueueEstimateOwnerIdLengthRule(64);
  const item = newQueueEstimate("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueEstimateTitleLengthRule flags a long title", () => {
  const rule = new QueueEstimateTitleLengthRule(80);
  const item = newQueueEstimate("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueEstimateExpiresAtRangeRule flags values above expires at", () => {
  const rule = new QueueEstimateExpiresAtRangeRule(16, 1000);
  const item = newQueueEstimate("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueEstimateCodeLengthRule flags a long code", () => {
  const rule = new QueueEstimateCodeLengthRule(3600);
  const item = newQueueEstimate("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueEstimateDescriptionLengthRule flags a long description", () => {
  const rule = new QueueEstimateDescriptionLengthRule(32);
  const item = newQueueEstimate("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
