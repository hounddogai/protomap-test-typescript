import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintVarianceCapacityRangeRule,
  ComplaintVarianceCountryLengthRule,
  ComplaintVarianceRequiredCodeRule,
  ComplaintVarianceRequiredUtmSourceRule,
  ComplaintVarianceUtmSourceLengthRule,
  defaultComplaintVarianceValidator,
} from "./complaint-variance-rules.js";
import { newComplaintVariance } from "./complaint-variance.js";

test("ComplaintVarianceValidator reports every problem", () => {
  const validator = defaultComplaintVarianceValidator();
  const item = newComplaintVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintVarianceUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ComplaintVarianceUtmSourceLengthRule(1000);
  const item = newComplaintVariance("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintVarianceRequiredCodeRule("complaint variance needs a value");
  const item = newComplaintVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintVarianceCapacityRangeRule flags values above capacity", () => {
  const rule = new ComplaintVarianceCapacityRangeRule(1000, 3600);
  const item = newComplaintVariance("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintVarianceRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new ComplaintVarianceRequiredUtmSourceRule("complaint variance needs a value");
  const item = newComplaintVariance("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintVarianceCountryLengthRule flags a long country", () => {
  const rule = new ComplaintVarianceCountryLengthRule(16);
  const item = newComplaintVariance("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
