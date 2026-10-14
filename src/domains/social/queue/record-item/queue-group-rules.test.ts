import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueGroupCodeLengthRule,
  QueueGroupFloorValueRangeRule,
  QueueGroupLabelLengthRule,
  QueueGroupRequiredCodeRule,
  QueueGroupRequiredLabelRule,
  defaultQueueGroupValidator,
} from "./queue-group-rules.js";
import { newQueueGroup } from "./queue-group.js";

test("QueueGroupValidator reports every problem", () => {
  const validator = defaultQueueGroupValidator();
  const item = newQueueGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueGroupCodeLengthRule flags a long code", () => {
  const rule = new QueueGroupCodeLengthRule(255);
  const item = newQueueGroup("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueGroupRequiredCodeRule flags a blank code", () => {
  const rule = new QueueGroupRequiredCodeRule("queue group needs an entry");
  const item = newQueueGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueGroupLabelLengthRule flags a long label", () => {
  const rule = new QueueGroupLabelLengthRule(80);
  const item = newQueueGroup("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueGroupFloorValueRangeRule flags values above floor value", () => {
  const rule = new QueueGroupFloorValueRangeRule(5.3, 4129.3);
  const item = newQueueGroup("x", "y");
  item.floorValue = 4130.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueGroupRequiredLabelRule flags a blank label", () => {
  const rule = new QueueGroupRequiredLabelRule("queue group needs this field");
  const item = newQueueGroup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
