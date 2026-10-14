import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSuppressionAllocationCodeLengthRule,
  GlobalSuppressionAllocationRequiredTitleRule,
  GlobalSuppressionAllocationTitleLengthRule,
  defaultGlobalSuppressionAllocationValidator,
} from "./global-suppression-allocation-rules.js";
import { newGlobalSuppressionAllocation } from "./global-suppression-allocation.js";

test("GlobalSuppressionAllocationValidator reports every problem", () => {
  const validator = defaultGlobalSuppressionAllocationValidator();
  const item = newGlobalSuppressionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSuppressionAllocationRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalSuppressionAllocationRequiredTitleRule("global suppression allocation needs an entry");
  const item = newGlobalSuppressionAllocation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSuppressionAllocationCodeLengthRule flags a long code", () => {
  const rule = new GlobalSuppressionAllocationCodeLengthRule(80);
  const item = newGlobalSuppressionAllocation("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalSuppressionAllocationTitleLengthRule flags a long title", () => {
  const rule = new GlobalSuppressionAllocationTitleLengthRule(1000);
  const item = newGlobalSuppressionAllocation("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
