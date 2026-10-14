import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointMilestoneCodeLengthRule,
  TouchpointMilestoneLabelLengthRule,
  TouchpointMilestoneLimitRangeRule,
  TouchpointMilestoneOpenRateRangeRule,
  TouchpointMilestoneRequiredCodeRule,
  TouchpointMilestoneRequiredLabelRule,
  defaultTouchpointMilestoneValidator,
} from "./touchpoint-milestone-rules.js";
import { newTouchpointMilestone } from "./touchpoint-milestone.js";

test("TouchpointMilestoneValidator reports every problem", () => {
  const validator = defaultTouchpointMilestoneValidator();
  const item = newTouchpointMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointMilestoneRequiredCodeRule("touchpoint milestone needs a value");
  const item = newTouchpointMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointMilestoneLimitRangeRule flags values above limit", () => {
  const rule = new TouchpointMilestoneLimitRangeRule(64, 120);
  const item = newTouchpointMilestone("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointMilestoneOpenRateRangeRule flags values above open rate", () => {
  const rule = new TouchpointMilestoneOpenRateRangeRule(7.4, 2949.4);
  const item = newTouchpointMilestone("x", "y");
  item.openRate = 2950.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointMilestoneLabelLengthRule flags a long label", () => {
  const rule = new TouchpointMilestoneLabelLengthRule(255);
  const item = newTouchpointMilestone("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new TouchpointMilestoneRequiredLabelRule("touchpoint milestone needs an entry");
  const item = newTouchpointMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointMilestoneCodeLengthRule flags a long code", () => {
  const rule = new TouchpointMilestoneCodeLengthRule(16);
  const item = newTouchpointMilestone("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
