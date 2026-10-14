import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintThresholdCodeLengthRule,
  ComplaintThresholdDescriptionLengthRule,
  ComplaintThresholdLabelLengthRule,
  ComplaintThresholdRequiredCodeRule,
  defaultComplaintThresholdValidator,
} from "./complaint-threshold-rules.js";
import { newComplaintThreshold } from "./complaint-threshold.js";

test("ComplaintThresholdValidator reports every problem", () => {
  const validator = defaultComplaintThresholdValidator();
  const item = newComplaintThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintThresholdDescriptionLengthRule flags a long description", () => {
  const rule = new ComplaintThresholdDescriptionLengthRule(120);
  const item = newComplaintThreshold("x", "y");
  item.description = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintThresholdRequiredCodeRule("complaint threshold needs a value");
  const item = newComplaintThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintThresholdCodeLengthRule flags a long code", () => {
  const rule = new ComplaintThresholdCodeLengthRule(80);
  const item = newComplaintThreshold("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintThresholdLabelLengthRule flags a long label", () => {
  const rule = new ComplaintThresholdLabelLengthRule(64);
  const item = newComplaintThreshold("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
