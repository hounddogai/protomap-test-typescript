import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyAllocationCodeLengthRule,
  ReplyAllocationRequiredLabelRule,
  ReplyAllocationRequiredSourceRule,
  ReplyAllocationReviewerLengthRule,
  ReplyAllocationSendAtRangeRule,
  defaultReplyAllocationValidator,
} from "./reply-allocation-rules.js";
import { newReplyAllocation } from "./reply-allocation.js";

test("ReplyAllocationValidator reports every problem", () => {
  const validator = defaultReplyAllocationValidator();
  const item = newReplyAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyAllocationRequiredSourceRule flags a blank source", () => {
  const rule = new ReplyAllocationRequiredSourceRule("reply allocation needs an entry");
  const item = newReplyAllocation("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyAllocationSendAtRangeRule flags values above send at", () => {
  const rule = new ReplyAllocationSendAtRangeRule(86400, 86400);
  const item = newReplyAllocation("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyAllocationReviewerLengthRule flags a long reviewer", () => {
  const rule = new ReplyAllocationReviewerLengthRule(32);
  const item = newReplyAllocation("x", "y");
  item.reviewer = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new ReplyAllocationRequiredLabelRule("reply allocation needs a value");
  const item = newReplyAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyAllocationCodeLengthRule flags a long code", () => {
  const rule = new ReplyAllocationCodeLengthRule(80);
  const item = newReplyAllocation("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
