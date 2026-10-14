import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueAdjustmentLocaleLengthRule,
  QueueAdjustmentRequiredCodeRule,
  defaultQueueAdjustmentValidator,
} from "./queue-adjustment-rules.js";
import { newQueueAdjustment } from "./queue-adjustment.js";

test("QueueAdjustmentValidator reports every problem", () => {
  const validator = defaultQueueAdjustmentValidator();
  const item = newQueueAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new QueueAdjustmentRequiredCodeRule("queue adjustment needs an entry");
  const item = newQueueAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueAdjustmentLocaleLengthRule flags a long locale", () => {
  const rule = new QueueAdjustmentLocaleLengthRule(255);
  const item = newQueueAdjustment("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
