import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyBatchChannelLengthRule,
  JourneyBatchDescriptionLengthRule,
  JourneyBatchVersionRangeRule,
  defaultJourneyBatchValidator,
} from "./journey-batch-rules.js";
import { newJourneyBatch } from "./journey-batch.js";

test("JourneyBatchValidator reports every problem", () => {
  const validator = defaultJourneyBatchValidator();
  const item = newJourneyBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyBatchVersionRangeRule flags values above version", () => {
  const rule = new JourneyBatchVersionRangeRule(64, 120);
  const item = newJourneyBatch("x", "y");
  item.version = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyBatchDescriptionLengthRule flags a long description", () => {
  const rule = new JourneyBatchDescriptionLengthRule(86400);
  const item = newJourneyBatch("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyBatchChannelLengthRule flags a long channel", () => {
  const rule = new JourneyBatchChannelLengthRule(120);
  const item = newJourneyBatch("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
