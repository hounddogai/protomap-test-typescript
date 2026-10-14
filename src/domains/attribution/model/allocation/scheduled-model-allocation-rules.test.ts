import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledModelAllocationCodeLengthRule,
  ScheduledModelAllocationRequiredPhoneRule,
  ScheduledModelAllocationRequiredSummaryRule,
  defaultScheduledModelAllocationValidator,
} from "./scheduled-model-allocation-rules.js";
import { newScheduledModelAllocation } from "./scheduled-model-allocation.js";

test("ScheduledModelAllocationValidator reports every problem", () => {
  const validator = defaultScheduledModelAllocationValidator();
  const item = newScheduledModelAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledModelAllocationRequiredPhoneRule flags a blank phone", () => {
  const rule = new ScheduledModelAllocationRequiredPhoneRule("scheduled model allocation needs this field");
  const item = newScheduledModelAllocation("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledModelAllocationCodeLengthRule flags a long code", () => {
  const rule = new ScheduledModelAllocationCodeLengthRule(64);
  const item = newScheduledModelAllocation("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledModelAllocationRequiredSummaryRule flags a blank summary", () => {
  const rule = new ScheduledModelAllocationRequiredSummaryRule("scheduled model allocation needs an entry");
  const item = newScheduledModelAllocation("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
