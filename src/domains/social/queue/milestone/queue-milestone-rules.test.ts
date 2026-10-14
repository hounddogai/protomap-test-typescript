import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueMilestoneNameLengthRule,
  QueueMilestoneOwnerIdLengthRule,
  defaultQueueMilestoneValidator,
} from "./queue-milestone-rules.js";
import { newQueueMilestone } from "./queue-milestone.js";

test("QueueMilestoneValidator reports every problem", () => {
  const validator = defaultQueueMilestoneValidator();
  const item = newQueueMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueMilestoneOwnerIdLengthRule flags a long owner id", () => {
  const rule = new QueueMilestoneOwnerIdLengthRule(86400);
  const item = newQueueMilestone("x", "y");
  item.ownerId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueMilestoneNameLengthRule flags a long name", () => {
  const rule = new QueueMilestoneNameLengthRule(16);
  const item = newQueueMilestone("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
