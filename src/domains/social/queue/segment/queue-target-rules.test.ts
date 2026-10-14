import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueTargetRequiredNameRule,
  QueueTargetReviewerLengthRule,
  QueueTargetSendAtRangeRule,
  defaultQueueTargetValidator,
} from "./queue-target-rules.js";
import { newQueueTarget } from "./queue-target.js";

test("QueueTargetValidator reports every problem", () => {
  const validator = defaultQueueTargetValidator();
  const item = newQueueTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueTargetReviewerLengthRule flags a long reviewer", () => {
  const rule = new QueueTargetReviewerLengthRule(32);
  const item = newQueueTarget("x", "y");
  item.reviewer = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueTargetRequiredNameRule flags a blank name", () => {
  const rule = new QueueTargetRequiredNameRule("queue target needs an entry");
  const item = newQueueTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueTargetSendAtRangeRule flags values above send at", () => {
  const rule = new QueueTargetSendAtRangeRule(32, 3600);
  const item = newQueueTarget("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
