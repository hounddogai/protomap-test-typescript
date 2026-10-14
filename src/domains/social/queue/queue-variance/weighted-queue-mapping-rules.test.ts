import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedQueueMappingChannelLengthRule,
  WeightedQueueMappingCodeLengthRule,
  WeightedQueueMappingQuantityRangeRule,
  WeightedQueueMappingRequiredChannelRule,
  defaultWeightedQueueMappingValidator,
} from "./weighted-queue-mapping-rules.js";
import { newWeightedQueueMapping } from "./weighted-queue-mapping.js";

test("WeightedQueueMappingValidator reports every problem", () => {
  const validator = defaultWeightedQueueMappingValidator();
  const item = newWeightedQueueMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedQueueMappingCodeLengthRule flags a long code", () => {
  const rule = new WeightedQueueMappingCodeLengthRule(16);
  const item = newWeightedQueueMapping("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedQueueMappingChannelLengthRule flags a long channel", () => {
  const rule = new WeightedQueueMappingChannelLengthRule(64);
  const item = newWeightedQueueMapping("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedQueueMappingQuantityRangeRule flags values above quantity", () => {
  const rule = new WeightedQueueMappingQuantityRangeRule(32, 80);
  const item = newWeightedQueueMapping("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedQueueMappingRequiredChannelRule flags a blank channel", () => {
  const rule = new WeightedQueueMappingRequiredChannelRule("weighted queue mapping needs a value");
  const item = newWeightedQueueMapping("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
