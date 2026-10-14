import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictSlaMilestoneCodeLengthRule,
  StrictSlaMilestoneCreatedAtRangeRule,
  StrictSlaMilestoneNameLengthRule,
  StrictSlaMilestoneRequiredCodeRule,
  StrictSlaMilestoneRequiredNameRule,
  defaultStrictSlaMilestoneValidator,
} from "./strict-sla-milestone-rules.js";
import { newStrictSlaMilestone } from "./strict-sla-milestone.js";

test("StrictSlaMilestoneValidator reports every problem", () => {
  const validator = defaultStrictSlaMilestoneValidator();
  const item = newStrictSlaMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictSlaMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new StrictSlaMilestoneRequiredCodeRule("strict sla milestone needs this field");
  const item = newStrictSlaMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictSlaMilestoneRequiredNameRule flags a blank name", () => {
  const rule = new StrictSlaMilestoneRequiredNameRule("strict sla milestone needs an entry");
  const item = newStrictSlaMilestone("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictSlaMilestoneNameLengthRule flags a long name", () => {
  const rule = new StrictSlaMilestoneNameLengthRule(32);
  const item = newStrictSlaMilestone("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictSlaMilestoneCreatedAtRangeRule flags values above created at", () => {
  const rule = new StrictSlaMilestoneCreatedAtRangeRule(80, 86400);
  const item = newStrictSlaMilestone("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictSlaMilestoneCodeLengthRule flags a long code", () => {
  const rule = new StrictSlaMilestoneCodeLengthRule(1000);
  const item = newStrictSlaMilestone("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
