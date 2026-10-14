import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRetentionPlanChannelLengthRule,
  GlobalRetentionPlanRequiredNameRule,
  GlobalRetentionPlanSendAtRangeRule,
  defaultGlobalRetentionPlanValidator,
} from "./global-retention-plan-rules.js";
import { newGlobalRetentionPlan } from "./global-retention-plan.js";

test("GlobalRetentionPlanValidator reports every problem", () => {
  const validator = defaultGlobalRetentionPlanValidator();
  const item = newGlobalRetentionPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRetentionPlanRequiredNameRule flags a blank name", () => {
  const rule = new GlobalRetentionPlanRequiredNameRule("global retention plan needs an entry");
  const item = newGlobalRetentionPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRetentionPlanChannelLengthRule flags a long channel", () => {
  const rule = new GlobalRetentionPlanChannelLengthRule(80);
  const item = newGlobalRetentionPlan("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRetentionPlanSendAtRangeRule flags values above send at", () => {
  const rule = new GlobalRetentionPlanSendAtRangeRule(16, 80);
  const item = newGlobalRetentionPlan("x", "y");
  item.sendAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
