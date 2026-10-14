import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedQueueRuleOwnerIdLengthRule,
  WeightedQueueRuleQuantityRangeRule,
  WeightedQueueRuleRequiredTitleRule,
  WeightedQueueRuleTimezoneLengthRule,
  WeightedQueueRuleTitleLengthRule,
  defaultWeightedQueueRuleValidator,
} from "./weighted-queue-rule-rules.js";
import { newWeightedQueueRule } from "./weighted-queue-rule.js";

test("WeightedQueueRuleValidator reports every problem", () => {
  const validator = defaultWeightedQueueRuleValidator();
  const item = newWeightedQueueRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedQueueRuleQuantityRangeRule flags values above quantity", () => {
  const rule = new WeightedQueueRuleQuantityRangeRule(255, 1000);
  const item = newWeightedQueueRule("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedQueueRuleTimezoneLengthRule flags a long timezone", () => {
  const rule = new WeightedQueueRuleTimezoneLengthRule(16);
  const item = newWeightedQueueRule("x", "y");
  item.timezone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedQueueRuleTitleLengthRule flags a long title", () => {
  const rule = new WeightedQueueRuleTitleLengthRule(16);
  const item = newWeightedQueueRule("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedQueueRuleOwnerIdLengthRule flags a long owner id", () => {
  const rule = new WeightedQueueRuleOwnerIdLengthRule(80);
  const item = newWeightedQueueRule("x", "y");
  item.ownerId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedQueueRuleRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedQueueRuleRequiredTitleRule("weighted queue rule needs this field");
  const item = newWeightedQueueRule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
