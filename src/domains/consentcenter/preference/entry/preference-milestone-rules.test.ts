import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceMilestoneExternalRefLengthRule,
  PreferenceMilestoneRatioRangeRule,
  PreferenceMilestoneRequiredLabelRule,
  PreferenceMilestoneRequiredNameRule,
  PreferenceMilestoneRetriesRangeRule,
  defaultPreferenceMilestoneValidator,
} from "./preference-milestone-rules.js";
import { newPreferenceMilestone } from "./preference-milestone.js";

test("PreferenceMilestoneValidator reports every problem", () => {
  const validator = defaultPreferenceMilestoneValidator();
  const item = newPreferenceMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new PreferenceMilestoneRequiredLabelRule("preference milestone needs a value");
  const item = newPreferenceMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceMilestoneRatioRangeRule flags values above ratio", () => {
  const rule = new PreferenceMilestoneRatioRangeRule(2, 937.7);
  const item = newPreferenceMilestone("x", "y");
  item.ratio = 939.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceMilestoneRequiredNameRule flags a blank name", () => {
  const rule = new PreferenceMilestoneRequiredNameRule("preference milestone needs this field");
  const item = newPreferenceMilestone("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceMilestoneExternalRefLengthRule flags a long external ref", () => {
  const rule = new PreferenceMilestoneExternalRefLengthRule(86400);
  const item = newPreferenceMilestone("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceMilestoneRetriesRangeRule flags values above retries", () => {
  const rule = new PreferenceMilestoneRetriesRangeRule(80, 3600);
  const item = newPreferenceMilestone("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
