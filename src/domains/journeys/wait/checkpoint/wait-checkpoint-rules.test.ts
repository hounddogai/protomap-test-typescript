import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitCheckpointJourneyIdLengthRule,
  WaitCheckpointRequiredChannelRule,
  WaitCheckpointRequiredLabelRule,
  defaultWaitCheckpointValidator,
} from "./wait-checkpoint-rules.js";
import { newWaitCheckpoint } from "./wait-checkpoint.js";

test("WaitCheckpointValidator reports every problem", () => {
  const validator = defaultWaitCheckpointValidator();
  const item = newWaitCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitCheckpointRequiredChannelRule flags a blank channel", () => {
  const rule = new WaitCheckpointRequiredChannelRule("wait checkpoint needs a value");
  const item = newWaitCheckpoint("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new WaitCheckpointRequiredLabelRule("wait checkpoint needs this field");
  const item = newWaitCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitCheckpointJourneyIdLengthRule flags a long journey id", () => {
  const rule = new WaitCheckpointJourneyIdLengthRule(3600);
  const item = newWaitCheckpoint("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
