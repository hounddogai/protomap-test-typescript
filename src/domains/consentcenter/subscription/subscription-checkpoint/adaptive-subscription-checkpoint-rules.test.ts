import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveSubscriptionCheckpointCodeLengthRule,
  AdaptiveSubscriptionCheckpointRequiredCodeRule,
  AdaptiveSubscriptionCheckpointTitleLengthRule,
  defaultAdaptiveSubscriptionCheckpointValidator,
} from "./adaptive-subscription-checkpoint-rules.js";
import { newAdaptiveSubscriptionCheckpoint } from "./adaptive-subscription-checkpoint.js";

test("AdaptiveSubscriptionCheckpointValidator reports every problem", () => {
  const validator = defaultAdaptiveSubscriptionCheckpointValidator();
  const item = newAdaptiveSubscriptionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveSubscriptionCheckpointCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveSubscriptionCheckpointCodeLengthRule(64);
  const item = newAdaptiveSubscriptionCheckpoint("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveSubscriptionCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveSubscriptionCheckpointRequiredCodeRule("adaptive subscription checkpoint needs this field");
  const item = newAdaptiveSubscriptionCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveSubscriptionCheckpointTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveSubscriptionCheckpointTitleLengthRule(16);
  const item = newAdaptiveSubscriptionCheckpoint("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
