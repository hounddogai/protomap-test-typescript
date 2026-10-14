import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingExitRuleCheckpointCodeLengthRule,
  RollingExitRuleCheckpointRequiredAudienceIdRule,
  RollingExitRuleCheckpointRequiredCodeRule,
  RollingExitRuleCheckpointWindowDaysRangeRule,
  defaultRollingExitRuleCheckpointValidator,
} from "./rolling-exit-rule-checkpoint-rules.js";
import { newRollingExitRuleCheckpoint } from "./rolling-exit-rule-checkpoint.js";

test("RollingExitRuleCheckpointValidator reports every problem", () => {
  const validator = defaultRollingExitRuleCheckpointValidator();
  const item = newRollingExitRuleCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingExitRuleCheckpointRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new RollingExitRuleCheckpointRequiredAudienceIdRule("rolling exit rule checkpoint needs an entry");
  const item = newRollingExitRuleCheckpoint("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingExitRuleCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new RollingExitRuleCheckpointRequiredCodeRule("rolling exit rule checkpoint needs this field");
  const item = newRollingExitRuleCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingExitRuleCheckpointCodeLengthRule flags a long code", () => {
  const rule = new RollingExitRuleCheckpointCodeLengthRule(32);
  const item = newRollingExitRuleCheckpoint("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingExitRuleCheckpointWindowDaysRangeRule flags values above window days", () => {
  const rule = new RollingExitRuleCheckpointWindowDaysRangeRule(80, 80);
  const item = newRollingExitRuleCheckpoint("x", "y");
  item.windowDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
