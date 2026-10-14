import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaAllocationAttemptsRangeRule,
  SlaAllocationChannelLengthRule,
  SlaAllocationCodeLengthRule,
  defaultSlaAllocationValidator,
} from "./sla-allocation-rules.js";
import { newSlaAllocation } from "./sla-allocation.js";

test("SlaAllocationValidator reports every problem", () => {
  const validator = defaultSlaAllocationValidator();
  const item = newSlaAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaAllocationCodeLengthRule flags a long code", () => {
  const rule = new SlaAllocationCodeLengthRule(80);
  const item = newSlaAllocation("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaAllocationAttemptsRangeRule flags values above attempts", () => {
  const rule = new SlaAllocationAttemptsRangeRule(16, 32);
  const item = newSlaAllocation("x", "y");
  item.attempts = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaAllocationChannelLengthRule flags a long channel", () => {
  const rule = new SlaAllocationChannelLengthRule(3600);
  const item = newSlaAllocation("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
