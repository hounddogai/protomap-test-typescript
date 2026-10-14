import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyVariancePriorityRangeRule,
  ReplyVarianceRequiredCodeRule,
  ReplyVarianceRequiredCohortRule,
  ReplyVarianceRequiredNameRule,
  defaultReplyVarianceValidator,
} from "./reply-variance-rules.js";
import { newReplyVariance } from "./reply-variance.js";

test("ReplyVarianceValidator reports every problem", () => {
  const validator = defaultReplyVarianceValidator();
  const item = newReplyVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyVarianceRequiredNameRule flags a blank name", () => {
  const rule = new ReplyVarianceRequiredNameRule("reply variance needs an entry");
  const item = newReplyVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyVariancePriorityRangeRule flags values above priority", () => {
  const rule = new ReplyVariancePriorityRangeRule(64, 3600);
  const item = newReplyVariance("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyVarianceRequiredCodeRule("reply variance needs a value");
  const item = newReplyVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyVarianceRequiredCohortRule flags a blank cohort", () => {
  const rule = new ReplyVarianceRequiredCohortRule("reply variance needs an entry");
  const item = newReplyVariance("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
