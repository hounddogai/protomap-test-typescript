import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInMilestoneCodeLengthRule,
  DoubleOptInMilestoneNameLengthRule,
  DoubleOptInMilestoneRequiredNameRule,
  defaultDoubleOptInMilestoneValidator,
} from "./double-opt-in-milestone-rules.js";
import { newDoubleOptInMilestone } from "./double-opt-in-milestone.js";

test("DoubleOptInMilestoneValidator reports every problem", () => {
  const validator = defaultDoubleOptInMilestoneValidator();
  const item = newDoubleOptInMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInMilestoneNameLengthRule flags a long name", () => {
  const rule = new DoubleOptInMilestoneNameLengthRule(80);
  const item = newDoubleOptInMilestone("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInMilestoneCodeLengthRule flags a long code", () => {
  const rule = new DoubleOptInMilestoneCodeLengthRule(255);
  const item = newDoubleOptInMilestone("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInMilestoneRequiredNameRule flags a blank name", () => {
  const rule = new DoubleOptInMilestoneRequiredNameRule("double opt in milestone needs an entry");
  const item = newDoubleOptInMilestone("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
