import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingActivationAllocationChannelLengthRule,
  PendingActivationAllocationCodeLengthRule,
  PendingActivationAllocationPriorityRangeRule,
  PendingActivationAllocationRequiredUtmSourceRule,
  PendingActivationAllocationTitleLengthRule,
  defaultPendingActivationAllocationValidator,
} from "./pending-activation-allocation-rules.js";
import { newPendingActivationAllocation } from "./pending-activation-allocation.js";

test("PendingActivationAllocationValidator reports every problem", () => {
  const validator = defaultPendingActivationAllocationValidator();
  const item = newPendingActivationAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingActivationAllocationChannelLengthRule flags a long channel", () => {
  const rule = new PendingActivationAllocationChannelLengthRule(86400);
  const item = newPendingActivationAllocation("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingActivationAllocationRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PendingActivationAllocationRequiredUtmSourceRule("pending activation allocation needs an entry");
  const item = newPendingActivationAllocation("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingActivationAllocationPriorityRangeRule flags values above priority", () => {
  const rule = new PendingActivationAllocationPriorityRangeRule(32, 1000);
  const item = newPendingActivationAllocation("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingActivationAllocationCodeLengthRule flags a long code", () => {
  const rule = new PendingActivationAllocationCodeLengthRule(16);
  const item = newPendingActivationAllocation("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingActivationAllocationTitleLengthRule flags a long title", () => {
  const rule = new PendingActivationAllocationTitleLengthRule(86400);
  const item = newPendingActivationAllocation("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
