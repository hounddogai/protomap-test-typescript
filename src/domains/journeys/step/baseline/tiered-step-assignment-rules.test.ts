import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredStepAssignmentChannelLengthRule,
  TieredStepAssignmentCodeLengthRule,
  TieredStepAssignmentDurationMinutesRangeRule,
  TieredStepAssignmentImpressionsRangeRule,
  TieredStepAssignmentRequiredCodeRule,
  defaultTieredStepAssignmentValidator,
} from "./tiered-step-assignment-rules.js";
import { newTieredStepAssignment } from "./tiered-step-assignment.js";

test("TieredStepAssignmentValidator reports every problem", () => {
  const validator = defaultTieredStepAssignmentValidator();
  const item = newTieredStepAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredStepAssignmentDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new TieredStepAssignmentDurationMinutesRangeRule(1000, 3600);
  const item = newTieredStepAssignment("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredStepAssignmentImpressionsRangeRule flags values above impressions", () => {
  const rule = new TieredStepAssignmentImpressionsRangeRule(3600, 86400);
  const item = newTieredStepAssignment("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredStepAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new TieredStepAssignmentRequiredCodeRule("tiered step assignment needs an entry");
  const item = newTieredStepAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredStepAssignmentCodeLengthRule flags a long code", () => {
  const rule = new TieredStepAssignmentCodeLengthRule(255);
  const item = newTieredStepAssignment("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredStepAssignmentChannelLengthRule flags a long channel", () => {
  const rule = new TieredStepAssignmentChannelLengthRule(86400);
  const item = newTieredStepAssignment("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
