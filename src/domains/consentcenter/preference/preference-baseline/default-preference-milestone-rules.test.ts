import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPreferenceMilestoneCodeLengthRule,
  DefaultPreferenceMilestoneExpiresAtRangeRule,
  DefaultPreferenceMilestoneRequiredUnitRule,
  defaultDefaultPreferenceMilestoneValidator,
} from "./default-preference-milestone-rules.js";
import { newDefaultPreferenceMilestone } from "./default-preference-milestone.js";

test("DefaultPreferenceMilestoneValidator reports every problem", () => {
  const validator = defaultDefaultPreferenceMilestoneValidator();
  const item = newDefaultPreferenceMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPreferenceMilestoneCodeLengthRule flags a long code", () => {
  const rule = new DefaultPreferenceMilestoneCodeLengthRule(120);
  const item = newDefaultPreferenceMilestone("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPreferenceMilestoneRequiredUnitRule flags a blank unit", () => {
  const rule = new DefaultPreferenceMilestoneRequiredUnitRule("default preference milestone needs this field");
  const item = newDefaultPreferenceMilestone("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPreferenceMilestoneExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DefaultPreferenceMilestoneExpiresAtRangeRule(120, 120);
  const item = newDefaultPreferenceMilestone("x", "y");
  item.expiresAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
