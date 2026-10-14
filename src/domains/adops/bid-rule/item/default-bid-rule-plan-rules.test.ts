import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultBidRulePlanDurationMinutesRangeRule,
  DefaultBidRulePlanExpiresAtRangeRule,
  DefaultBidRulePlanRatioRangeRule,
  defaultDefaultBidRulePlanValidator,
} from "./default-bid-rule-plan-rules.js";
import { newDefaultBidRulePlan } from "./default-bid-rule-plan.js";

test("DefaultBidRulePlanValidator reports every problem", () => {
  const validator = defaultDefaultBidRulePlanValidator();
  const item = newDefaultBidRulePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultBidRulePlanDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultBidRulePlanDurationMinutesRangeRule(1000, 86400);
  const item = newDefaultBidRulePlan("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultBidRulePlanRatioRangeRule flags values above ratio", () => {
  const rule = new DefaultBidRulePlanRatioRangeRule(8.8, 3742.3);
  const item = newDefaultBidRulePlan("x", "y");
  item.ratio = 3743.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultBidRulePlanExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DefaultBidRulePlanExpiresAtRangeRule(64, 120);
  const item = newDefaultBidRulePlan("x", "y");
  item.expiresAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
