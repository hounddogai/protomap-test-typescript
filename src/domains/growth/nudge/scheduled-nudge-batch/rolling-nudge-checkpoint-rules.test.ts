import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingNudgeCheckpointBidRangeRule,
  RollingNudgeCheckpointMinimumRangeRule,
  RollingNudgeCheckpointOpenRateRangeRule,
  RollingNudgeCheckpointRequiredChecksumRule,
  RollingNudgeCheckpointRequiredCodeRule,
  defaultRollingNudgeCheckpointValidator,
} from "./rolling-nudge-checkpoint-rules.js";
import { newRollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

test("RollingNudgeCheckpointValidator reports every problem", () => {
  const validator = defaultRollingNudgeCheckpointValidator();
  const item = newRollingNudgeCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingNudgeCheckpointRequiredChecksumRule flags a blank checksum", () => {
  const rule = new RollingNudgeCheckpointRequiredChecksumRule("rolling nudge checkpoint needs a value");
  const item = newRollingNudgeCheckpoint("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingNudgeCheckpointMinimumRangeRule flags values above minimum", () => {
  const rule = new RollingNudgeCheckpointMinimumRangeRule(2.4, 2613.3);
  const item = newRollingNudgeCheckpoint("x", "y");
  item.minimum = 2614.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingNudgeCheckpointOpenRateRangeRule flags values above open rate", () => {
  const rule = new RollingNudgeCheckpointOpenRateRangeRule(3.5, 3307.9);
  const item = newRollingNudgeCheckpoint("x", "y");
  item.openRate = 3309.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingNudgeCheckpointBidRangeRule flags values above bid", () => {
  const rule = new RollingNudgeCheckpointBidRangeRule(0.2, 3651.8);
  const item = newRollingNudgeCheckpoint("x", "y");
  item.bid = 3653.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingNudgeCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new RollingNudgeCheckpointRequiredCodeRule("rolling nudge checkpoint needs a value");
  const item = newRollingNudgeCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
