import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaBatchCodeLengthRule,
  SlaBatchNameLengthRule,
  SlaBatchRequiredCodeRule,
  SlaBatchThresholdRangeRule,
  defaultSlaBatchValidator,
} from "./sla-batch-rules.js";
import { newSlaBatch } from "./sla-batch.js";

test("SlaBatchValidator reports every problem", () => {
  const validator = defaultSlaBatchValidator();
  const item = newSlaBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaBatchThresholdRangeRule flags values above threshold", () => {
  const rule = new SlaBatchThresholdRangeRule(3.2, 3034.7);
  const item = newSlaBatch("x", "y");
  item.threshold = 3036.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaBatchNameLengthRule flags a long name", () => {
  const rule = new SlaBatchNameLengthRule(3600);
  const item = newSlaBatch("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaBatchCodeLengthRule flags a long code", () => {
  const rule = new SlaBatchCodeLengthRule(64);
  const item = newSlaBatch("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaBatchRequiredCodeRule flags a blank code", () => {
  const rule = new SlaBatchRequiredCodeRule("sla batch needs a value");
  const item = newSlaBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
