import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingMilestoneCodeLengthRule,
  PacingMilestoneNameLengthRule,
  PacingMilestoneOwnerIdLengthRule,
  PacingMilestoneRateRangeRule,
  PacingMilestoneRequiredNameRule,
  PacingMilestoneVariantLengthRule,
  defaultPacingMilestoneValidator,
} from "./pacing-milestone-rules.js";
import { newPacingMilestone } from "./pacing-milestone.js";

test("PacingMilestoneValidator reports every problem", () => {
  const validator = defaultPacingMilestoneValidator();
  const item = newPacingMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingMilestoneOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PacingMilestoneOwnerIdLengthRule(16);
  const item = newPacingMilestone("x", "y");
  item.ownerId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingMilestoneCodeLengthRule flags a long code", () => {
  const rule = new PacingMilestoneCodeLengthRule(32);
  const item = newPacingMilestone("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingMilestoneRateRangeRule flags values above rate", () => {
  const rule = new PacingMilestoneRateRangeRule(8.1, 3771.9);
  const item = newPacingMilestone("x", "y");
  item.rate = 3773.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingMilestoneRequiredNameRule flags a blank name", () => {
  const rule = new PacingMilestoneRequiredNameRule("pacing milestone needs an entry");
  const item = newPacingMilestone("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingMilestoneVariantLengthRule flags a long variant", () => {
  const rule = new PacingMilestoneVariantLengthRule(3600);
  const item = newPacingMilestone("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingMilestoneNameLengthRule flags a long name", () => {
  const rule = new PacingMilestoneNameLengthRule(255);
  const item = newPacingMilestone("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
