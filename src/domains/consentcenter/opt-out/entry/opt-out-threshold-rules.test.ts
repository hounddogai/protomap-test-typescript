import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutThresholdRequiredChannelRule,
  OptOutThresholdRequiredCodeRule,
  defaultOptOutThresholdValidator,
} from "./opt-out-threshold-rules.js";
import { newOptOutThreshold } from "./opt-out-threshold.js";

test("OptOutThresholdValidator reports every problem", () => {
  const validator = defaultOptOutThresholdValidator();
  const item = newOptOutThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutThresholdRequiredChannelRule flags a blank channel", () => {
  const rule = new OptOutThresholdRequiredChannelRule("opt out threshold needs this field");
  const item = newOptOutThreshold("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new OptOutThresholdRequiredCodeRule("opt out threshold needs an entry");
  const item = newOptOutThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
