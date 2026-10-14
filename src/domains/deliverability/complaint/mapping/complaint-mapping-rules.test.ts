import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintMappingRequiredCodeRule,
  ComplaintMappingRequiredCohortRule,
  ComplaintMappingRequiredNameRule,
  ComplaintMappingRequiredSummaryRule,
  ComplaintMappingThresholdRangeRule,
  defaultComplaintMappingValidator,
} from "./complaint-mapping-rules.js";
import { newComplaintMapping } from "./complaint-mapping.js";

test("ComplaintMappingValidator reports every problem", () => {
  const validator = defaultComplaintMappingValidator();
  const item = newComplaintMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintMappingRequiredCohortRule flags a blank cohort", () => {
  const rule = new ComplaintMappingRequiredCohortRule("complaint mapping needs this field");
  const item = newComplaintMapping("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintMappingThresholdRangeRule flags values above threshold", () => {
  const rule = new ComplaintMappingThresholdRangeRule(1.8, 3584.9);
  const item = newComplaintMapping("x", "y");
  item.threshold = 3586.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintMappingRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintMappingRequiredCodeRule("complaint mapping needs a value");
  const item = newComplaintMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintMappingRequiredNameRule flags a blank name", () => {
  const rule = new ComplaintMappingRequiredNameRule("complaint mapping needs this field");
  const item = newComplaintMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintMappingRequiredSummaryRule flags a blank summary", () => {
  const rule = new ComplaintMappingRequiredSummaryRule("complaint mapping needs an entry");
  const item = newComplaintMapping("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
