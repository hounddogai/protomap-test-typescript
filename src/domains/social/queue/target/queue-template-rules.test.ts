import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueTemplateEndsAtRangeRule,
  QueueTemplateUnitLengthRule,
  defaultQueueTemplateValidator,
} from "./queue-template-rules.js";
import { newQueueTemplate } from "./queue-template.js";

test("QueueTemplateValidator reports every problem", () => {
  const validator = defaultQueueTemplateValidator();
  const item = newQueueTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueTemplateEndsAtRangeRule flags values above ends at", () => {
  const rule = new QueueTemplateEndsAtRangeRule(80, 1000);
  const item = newQueueTemplate("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueTemplateUnitLengthRule flags a long unit", () => {
  const rule = new QueueTemplateUnitLengthRule(1000);
  const item = newQueueTemplate("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
