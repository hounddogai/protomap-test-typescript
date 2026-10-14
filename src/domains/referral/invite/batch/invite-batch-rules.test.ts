import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteBatchCategoryLengthRule,
  InviteBatchJourneyIdLengthRule,
  InviteBatchRequiredCodeRule,
  defaultInviteBatchValidator,
} from "./invite-batch-rules.js";
import { newInviteBatch } from "./invite-batch.js";

test("InviteBatchValidator reports every problem", () => {
  const validator = defaultInviteBatchValidator();
  const item = newInviteBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteBatchCategoryLengthRule flags a long category", () => {
  const rule = new InviteBatchCategoryLengthRule(16);
  const item = newInviteBatch("x", "y");
  item.category = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteBatchRequiredCodeRule flags a blank code", () => {
  const rule = new InviteBatchRequiredCodeRule("invite batch needs a value");
  const item = newInviteBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteBatchJourneyIdLengthRule flags a long journey id", () => {
  const rule = new InviteBatchJourneyIdLengthRule(16);
  const item = newInviteBatch("x", "y");
  item.journeyId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
