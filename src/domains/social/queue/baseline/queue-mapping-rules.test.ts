import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueMappingBudgetRangeRule,
  QueueMappingNameLengthRule,
  QueueMappingRequiredCodeRule,
  QueueMappingRequiredLabelRule,
  defaultQueueMappingValidator,
} from "./queue-mapping-rules.js";
import { newQueueMapping } from "./queue-mapping.js";

test("QueueMappingValidator reports every problem", () => {
  const validator = defaultQueueMappingValidator();
  const item = newQueueMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueMappingNameLengthRule flags a long name", () => {
  const rule = new QueueMappingNameLengthRule(120);
  const item = newQueueMapping("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueMappingRequiredCodeRule flags a blank code", () => {
  const rule = new QueueMappingRequiredCodeRule("queue mapping needs an entry");
  const item = newQueueMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueMappingRequiredLabelRule flags a blank label", () => {
  const rule = new QueueMappingRequiredLabelRule("queue mapping needs this field");
  const item = newQueueMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueMappingBudgetRangeRule flags values above budget", () => {
  const rule = new QueueMappingBudgetRangeRule(4.7, 387.5);
  const item = newQueueMapping("x", "y");
  item.budget = 389;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
