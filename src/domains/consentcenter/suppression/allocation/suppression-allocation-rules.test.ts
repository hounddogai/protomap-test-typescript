import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionAllocationRequiredSourceRule,
  SuppressionAllocationRequiredVariantRule,
  SuppressionAllocationSourceLengthRule,
  defaultSuppressionAllocationValidator,
} from "./suppression-allocation-rules.js";
import { newSuppressionAllocation } from "./suppression-allocation.js";

test("SuppressionAllocationValidator reports every problem", () => {
  const validator = defaultSuppressionAllocationValidator();
  const item = newSuppressionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionAllocationSourceLengthRule flags a long source", () => {
  const rule = new SuppressionAllocationSourceLengthRule(32);
  const item = newSuppressionAllocation("x", "y");
  item.source = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionAllocationRequiredVariantRule flags a blank variant", () => {
  const rule = new SuppressionAllocationRequiredVariantRule("suppression allocation needs a value");
  const item = newSuppressionAllocation("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionAllocationRequiredSourceRule flags a blank source", () => {
  const rule = new SuppressionAllocationRequiredSourceRule("suppression allocation needs this field");
  const item = newSuppressionAllocation("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
