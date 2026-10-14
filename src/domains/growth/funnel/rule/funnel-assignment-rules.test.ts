import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelAssignmentFloorValueRangeRule,
  FunnelAssignmentRequiredCurrencyRule,
  defaultFunnelAssignmentValidator,
} from "./funnel-assignment-rules.js";
import { newFunnelAssignment } from "./funnel-assignment.js";

test("FunnelAssignmentValidator reports every problem", () => {
  const validator = defaultFunnelAssignmentValidator();
  const item = newFunnelAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelAssignmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new FunnelAssignmentFloorValueRangeRule(1.1, 2078.7);
  const item = newFunnelAssignment("x", "y");
  item.floorValue = 2080.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelAssignmentRequiredCurrencyRule flags a blank currency", () => {
  const rule = new FunnelAssignmentRequiredCurrencyRule("funnel assignment needs a value");
  const item = newFunnelAssignment("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
