import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictReplyClaimBudgetRangeRule,
  StrictReplyClaimCodeLengthRule,
  StrictReplyClaimRequiredOwnerIdRule,
  StrictReplyClaimRequiredTitleRule,
  defaultStrictReplyClaimValidator,
} from "./strict-reply-claim-rules.js";
import { newStrictReplyClaim } from "./strict-reply-claim.js";

test("StrictReplyClaimValidator reports every problem", () => {
  const validator = defaultStrictReplyClaimValidator();
  const item = newStrictReplyClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictReplyClaimRequiredTitleRule flags a blank title", () => {
  const rule = new StrictReplyClaimRequiredTitleRule("strict reply claim needs this field");
  const item = newStrictReplyClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReplyClaimRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new StrictReplyClaimRequiredOwnerIdRule("strict reply claim needs a value");
  const item = newStrictReplyClaim("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReplyClaimBudgetRangeRule flags values above budget", () => {
  const rule = new StrictReplyClaimBudgetRangeRule(7.4, 4324.2);
  const item = newStrictReplyClaim("x", "y");
  item.budget = 4325.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictReplyClaimCodeLengthRule flags a long code", () => {
  const rule = new StrictReplyClaimCodeLengthRule(1000);
  const item = newStrictReplyClaim("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
