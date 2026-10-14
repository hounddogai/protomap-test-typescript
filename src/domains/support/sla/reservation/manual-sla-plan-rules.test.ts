import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualSlaPlanLabelLengthRule,
  ManualSlaPlanRequiredLabelRule,
  ManualSlaPlanReviewerLengthRule,
  defaultManualSlaPlanValidator,
} from "./manual-sla-plan-rules.js";
import { newManualSlaPlan } from "./manual-sla-plan.js";

test("ManualSlaPlanValidator reports every problem", () => {
  const validator = defaultManualSlaPlanValidator();
  const item = newManualSlaPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualSlaPlanLabelLengthRule flags a long label", () => {
  const rule = new ManualSlaPlanLabelLengthRule(3600);
  const item = newManualSlaPlan("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualSlaPlanReviewerLengthRule flags a long reviewer", () => {
  const rule = new ManualSlaPlanReviewerLengthRule(3600);
  const item = newManualSlaPlan("x", "y");
  item.reviewer = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualSlaPlanRequiredLabelRule flags a blank label", () => {
  const rule = new ManualSlaPlanRequiredLabelRule("manual sla plan needs an entry");
  const item = newManualSlaPlan("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
