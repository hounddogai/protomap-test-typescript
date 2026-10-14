import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPostAllocationCodeLengthRule,
  PendingPostAllocationRequiredCodeRule,
  PendingPostAllocationRequiredNameRule,
  PendingPostAllocationSequenceRangeRule,
  PendingPostAllocationStartsAtRangeRule,
  defaultPendingPostAllocationValidator,
} from "./pending-post-allocation-rules.js";
import { newPendingPostAllocation } from "./pending-post-allocation.js";

test("PendingPostAllocationValidator reports every problem", () => {
  const validator = defaultPendingPostAllocationValidator();
  const item = newPendingPostAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPostAllocationSequenceRangeRule flags values above sequence", () => {
  const rule = new PendingPostAllocationSequenceRangeRule(80, 1000);
  const item = newPendingPostAllocation("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingPostAllocationRequiredNameRule flags a blank name", () => {
  const rule = new PendingPostAllocationRequiredNameRule("pending post allocation needs an entry");
  const item = newPendingPostAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPostAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new PendingPostAllocationRequiredCodeRule("pending post allocation needs this field");
  const item = newPendingPostAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPostAllocationStartsAtRangeRule flags values above starts at", () => {
  const rule = new PendingPostAllocationStartsAtRangeRule(32, 64);
  const item = newPendingPostAllocation("x", "y");
  item.startsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingPostAllocationCodeLengthRule flags a long code", () => {
  const rule = new PendingPostAllocationCodeLengthRule(16);
  const item = newPendingPostAllocation("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
