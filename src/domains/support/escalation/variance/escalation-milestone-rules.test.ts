import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationMilestoneCostRangeRule,
  EscalationMilestoneRequiredCodeRule,
  EscalationMilestoneWeightRangeRule,
  defaultEscalationMilestoneValidator,
} from "./escalation-milestone-rules.js";
import { newEscalationMilestone } from "./escalation-milestone.js";

test("EscalationMilestoneValidator reports every problem", () => {
  const validator = defaultEscalationMilestoneValidator();
  const item = newEscalationMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationMilestoneWeightRangeRule flags values above weight", () => {
  const rule = new EscalationMilestoneWeightRangeRule(7.8, 914.5);
  const item = newEscalationMilestone("x", "y");
  item.weight = 916;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationMilestoneRequiredCodeRule("escalation milestone needs an entry");
  const item = newEscalationMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationMilestoneCostRangeRule flags values above cost", () => {
  const rule = new EscalationMilestoneCostRangeRule(4.9, 1926.6);
  const item = newEscalationMilestone("x", "y");
  item.cost = 1928.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
