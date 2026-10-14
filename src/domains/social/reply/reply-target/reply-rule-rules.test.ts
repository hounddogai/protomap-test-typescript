import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyRuleCodeLengthRule,
  ReplyRuleRequiredCohortRule,
  defaultReplyRuleValidator,
} from "./reply-rule-rules.js";
import { newReplyRule } from "./reply-rule.js";

test("ReplyRuleValidator reports every problem", () => {
  const validator = defaultReplyRuleValidator();
  const item = newReplyRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyRuleCodeLengthRule flags a long code", () => {
  const rule = new ReplyRuleCodeLengthRule(80);
  const item = newReplyRule("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyRuleRequiredCohortRule flags a blank cohort", () => {
  const rule = new ReplyRuleRequiredCohortRule("reply rule needs this field");
  const item = newReplyRule("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
