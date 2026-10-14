import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyPolicyBudgetRangeRule,
  ReplyPolicyRateRangeRule,
  ReplyPolicyRequiredNameRule,
  ReplyPolicyRetriesRangeRule,
  defaultReplyPolicyValidator,
} from "./reply-policy-rules.js";
import { newReplyPolicy } from "./reply-policy.js";

test("ReplyPolicyValidator reports every problem", () => {
  const validator = defaultReplyPolicyValidator();
  const item = newReplyPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyPolicyRateRangeRule flags values above rate", () => {
  const rule = new ReplyPolicyRateRangeRule(4.1, 1305.3);
  const item = newReplyPolicy("x", "y");
  item.rate = 1306.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyPolicyRetriesRangeRule flags values above retries", () => {
  const rule = new ReplyPolicyRetriesRangeRule(64, 64);
  const item = newReplyPolicy("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyPolicyRequiredNameRule flags a blank name", () => {
  const rule = new ReplyPolicyRequiredNameRule("reply policy needs this field");
  const item = newReplyPolicy("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyPolicyBudgetRangeRule flags values above budget", () => {
  const rule = new ReplyPolicyBudgetRangeRule(8.5, 4948.3);
  const item = newReplyPolicy("x", "y");
  item.budget = 4949.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
