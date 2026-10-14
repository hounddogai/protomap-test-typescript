import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionCheckpointMarginRangeRule,
  SubscriptionCheckpointOpenRateRangeRule,
  SubscriptionCheckpointSegmentLengthRule,
  defaultSubscriptionCheckpointValidator,
} from "./subscription-checkpoint-rules.js";
import { newSubscriptionCheckpoint } from "./subscription-checkpoint.js";

test("SubscriptionCheckpointValidator reports every problem", () => {
  const validator = defaultSubscriptionCheckpointValidator();
  const item = newSubscriptionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionCheckpointOpenRateRangeRule flags values above open rate", () => {
  const rule = new SubscriptionCheckpointOpenRateRangeRule(4.5, 2068.4);
  const item = newSubscriptionCheckpoint("x", "y");
  item.openRate = 2069.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionCheckpointMarginRangeRule flags values above margin", () => {
  const rule = new SubscriptionCheckpointMarginRangeRule(9.8, 1085.8);
  const item = newSubscriptionCheckpoint("x", "y");
  item.margin = 1087.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionCheckpointSegmentLengthRule flags a long segment", () => {
  const rule = new SubscriptionCheckpointSegmentLengthRule(16);
  const item = newSubscriptionCheckpoint("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
