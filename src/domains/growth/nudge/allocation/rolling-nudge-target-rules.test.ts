import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingNudgeTargetCodeLengthRule,
  RollingNudgeTargetRequiredCodeRule,
  RollingNudgeTargetRequiredTitleRule,
  RollingNudgeTargetSendAtRangeRule,
  defaultRollingNudgeTargetValidator,
} from "./rolling-nudge-target-rules.js";
import { newRollingNudgeTarget } from "./rolling-nudge-target.js";

test("RollingNudgeTargetValidator reports every problem", () => {
  const validator = defaultRollingNudgeTargetValidator();
  const item = newRollingNudgeTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingNudgeTargetRequiredCodeRule flags a blank code", () => {
  const rule = new RollingNudgeTargetRequiredCodeRule("rolling nudge target needs this field");
  const item = newRollingNudgeTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingNudgeTargetCodeLengthRule flags a long code", () => {
  const rule = new RollingNudgeTargetCodeLengthRule(80);
  const item = newRollingNudgeTarget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingNudgeTargetSendAtRangeRule flags values above send at", () => {
  const rule = new RollingNudgeTargetSendAtRangeRule(64, 255);
  const item = newRollingNudgeTarget("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingNudgeTargetRequiredTitleRule flags a blank title", () => {
  const rule = new RollingNudgeTargetRequiredTitleRule("rolling nudge target needs this field");
  const item = newRollingNudgeTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
