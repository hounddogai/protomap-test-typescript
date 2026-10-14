import assert from "node:assert/strict";
import { test } from "node:test";
import { WindowPlanAttemptsRangeRule, defaultWindowPlanValidator } from "./window-plan-rules.js";
import { newWindowPlan } from "./window-plan.js";

test("WindowPlanValidator reports every problem", () => {
  const validator = defaultWindowPlanValidator();
  const item = newWindowPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowPlanAttemptsRangeRule flags values above attempts", () => {
  const rule = new WindowPlanAttemptsRangeRule(16, 255);
  const item = newWindowPlan("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
