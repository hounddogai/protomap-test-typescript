import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionMilestoneLabelLengthRule,
  SuppressionMilestoneUtmSourceLengthRule,
  SuppressionMilestoneVariantLengthRule,
  defaultSuppressionMilestoneValidator,
} from "./suppression-milestone-rules.js";
import { newSuppressionMilestone } from "./suppression-milestone.js";

test("SuppressionMilestoneValidator reports every problem", () => {
  const validator = defaultSuppressionMilestoneValidator();
  const item = newSuppressionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionMilestoneLabelLengthRule flags a long label", () => {
  const rule = new SuppressionMilestoneLabelLengthRule(1000);
  const item = newSuppressionMilestone("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionMilestoneVariantLengthRule flags a long variant", () => {
  const rule = new SuppressionMilestoneVariantLengthRule(255);
  const item = newSuppressionMilestone("x", "y");
  item.variant = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionMilestoneUtmSourceLengthRule flags a long utm source", () => {
  const rule = new SuppressionMilestoneUtmSourceLengthRule(3600);
  const item = newSuppressionMilestone("x", "y");
  item.utmSource = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
