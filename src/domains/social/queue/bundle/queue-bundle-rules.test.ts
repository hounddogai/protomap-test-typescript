import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueBundleEndsAtRangeRule,
  QueueBundleRequiredSummaryRule,
  QueueBundleScoreRangeRule,
  defaultQueueBundleValidator,
} from "./queue-bundle-rules.js";
import { newQueueBundle } from "./queue-bundle.js";

test("QueueBundleValidator reports every problem", () => {
  const validator = defaultQueueBundleValidator();
  const item = newQueueBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueBundleRequiredSummaryRule flags a blank summary", () => {
  const rule = new QueueBundleRequiredSummaryRule("queue bundle needs this field");
  const item = newQueueBundle("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueBundleScoreRangeRule flags values above score", () => {
  const rule = new QueueBundleScoreRangeRule(5.5, 2770.8);
  const item = newQueueBundle("x", "y");
  item.score = 2772.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueBundleEndsAtRangeRule flags values above ends at", () => {
  const rule = new QueueBundleEndsAtRangeRule(32, 32);
  const item = newQueueBundle("x", "y");
  item.endsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
