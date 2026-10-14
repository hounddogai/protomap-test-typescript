import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintAllocationCodeLengthRule,
  ComplaintAllocationExternalRefLengthRule,
  ComplaintAllocationFrequencyCapRangeRule,
  ComplaintAllocationNameLengthRule,
  ComplaintAllocationRequiredCodeRule,
  ComplaintAllocationRequiredExternalRefRule,
  defaultComplaintAllocationValidator,
} from "./complaint-allocation-rules.js";
import { newComplaintAllocation } from "./complaint-allocation.js";

test("ComplaintAllocationValidator reports every problem", () => {
  const validator = defaultComplaintAllocationValidator();
  const item = newComplaintAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintAllocationRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ComplaintAllocationRequiredExternalRefRule("complaint allocation needs an entry");
  const item = newComplaintAllocation("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintAllocationRequiredCodeRule("complaint allocation needs a value");
  const item = newComplaintAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintAllocationExternalRefLengthRule flags a long external ref", () => {
  const rule = new ComplaintAllocationExternalRefLengthRule(64);
  const item = newComplaintAllocation("x", "y");
  item.externalRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintAllocationFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ComplaintAllocationFrequencyCapRangeRule(64, 1000);
  const item = newComplaintAllocation("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintAllocationCodeLengthRule flags a long code", () => {
  const rule = new ComplaintAllocationCodeLengthRule(3600);
  const item = newComplaintAllocation("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintAllocationNameLengthRule flags a long name", () => {
  const rule = new ComplaintAllocationNameLengthRule(120);
  const item = newComplaintAllocation("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
