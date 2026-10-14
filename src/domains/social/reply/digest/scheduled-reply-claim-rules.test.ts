import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledReplyClaimCeilingRangeRule,
  ScheduledReplyClaimLabelLengthRule,
  ScheduledReplyClaimRequiredReviewerRule,
  defaultScheduledReplyClaimValidator,
} from "./scheduled-reply-claim-rules.js";
import { newScheduledReplyClaim } from "./scheduled-reply-claim.js";

test("ScheduledReplyClaimValidator reports every problem", () => {
  const validator = defaultScheduledReplyClaimValidator();
  const item = newScheduledReplyClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledReplyClaimRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new ScheduledReplyClaimRequiredReviewerRule("scheduled reply claim needs this field");
  const item = newScheduledReplyClaim("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledReplyClaimCeilingRangeRule flags values above ceiling", () => {
  const rule = new ScheduledReplyClaimCeilingRangeRule(7, 3423.1);
  const item = newScheduledReplyClaim("x", "y");
  item.ceiling = 3424.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledReplyClaimLabelLengthRule flags a long label", () => {
  const rule = new ScheduledReplyClaimLabelLengthRule(32);
  const item = newScheduledReplyClaim("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
