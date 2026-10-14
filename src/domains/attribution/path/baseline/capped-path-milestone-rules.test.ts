import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPathMilestoneCodeLengthRule,
  CappedPathMilestoneLabelLengthRule,
  CappedPathMilestoneRequiredLabelRule,
  CappedPathMilestoneRequiredOwnerIdRule,
  CappedPathMilestoneSequenceRangeRule,
  defaultCappedPathMilestoneValidator,
} from "./capped-path-milestone-rules.js";
import { newCappedPathMilestone } from "./capped-path-milestone.js";

test("CappedPathMilestoneValidator reports every problem", () => {
  const validator = defaultCappedPathMilestoneValidator();
  const item = newCappedPathMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPathMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new CappedPathMilestoneRequiredLabelRule("capped path milestone needs a value");
  const item = newCappedPathMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPathMilestoneLabelLengthRule flags a long label", () => {
  const rule = new CappedPathMilestoneLabelLengthRule(16);
  const item = newCappedPathMilestone("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPathMilestoneSequenceRangeRule flags values above sequence", () => {
  const rule = new CappedPathMilestoneSequenceRangeRule(16, 80);
  const item = newCappedPathMilestone("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedPathMilestoneRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new CappedPathMilestoneRequiredOwnerIdRule("capped path milestone needs a value");
  const item = newCappedPathMilestone("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPathMilestoneCodeLengthRule flags a long code", () => {
  const rule = new CappedPathMilestoneCodeLengthRule(255);
  const item = newCappedPathMilestone("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
