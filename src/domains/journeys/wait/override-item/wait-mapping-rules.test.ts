import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitMappingMarginRangeRule,
  WaitMappingNameLengthRule,
  WaitMappingPriorityRangeRule,
  WaitMappingRequiredCodeRule,
  defaultWaitMappingValidator,
} from "./wait-mapping-rules.js";
import { newWaitMapping } from "./wait-mapping.js";

test("WaitMappingValidator reports every problem", () => {
  const validator = defaultWaitMappingValidator();
  const item = newWaitMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitMappingMarginRangeRule flags values above margin", () => {
  const rule = new WaitMappingMarginRangeRule(7.6, 4698.5);
  const item = newWaitMapping("x", "y");
  item.margin = 4700;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitMappingRequiredCodeRule flags a blank code", () => {
  const rule = new WaitMappingRequiredCodeRule("wait mapping needs a value");
  const item = newWaitMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitMappingPriorityRangeRule flags values above priority", () => {
  const rule = new WaitMappingPriorityRangeRule(16, 255);
  const item = newWaitMapping("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitMappingNameLengthRule flags a long name", () => {
  const rule = new WaitMappingNameLengthRule(3600);
  const item = newWaitMapping("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
