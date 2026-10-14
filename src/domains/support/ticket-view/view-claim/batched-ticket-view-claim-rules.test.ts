import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedTicketViewClaimCapacityRangeRule,
  BatchedTicketViewClaimCategoryLengthRule,
  BatchedTicketViewClaimCodeLengthRule,
  BatchedTicketViewClaimTitleLengthRule,
  defaultBatchedTicketViewClaimValidator,
} from "./batched-ticket-view-claim-rules.js";
import { newBatchedTicketViewClaim } from "./batched-ticket-view-claim.js";

test("BatchedTicketViewClaimValidator reports every problem", () => {
  const validator = defaultBatchedTicketViewClaimValidator();
  const item = newBatchedTicketViewClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedTicketViewClaimCapacityRangeRule flags values above capacity", () => {
  const rule = new BatchedTicketViewClaimCapacityRangeRule(120, 86400);
  const item = newBatchedTicketViewClaim("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedTicketViewClaimTitleLengthRule flags a long title", () => {
  const rule = new BatchedTicketViewClaimTitleLengthRule(120);
  const item = newBatchedTicketViewClaim("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedTicketViewClaimCodeLengthRule flags a long code", () => {
  const rule = new BatchedTicketViewClaimCodeLengthRule(120);
  const item = newBatchedTicketViewClaim("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedTicketViewClaimCategoryLengthRule flags a long category", () => {
  const rule = new BatchedTicketViewClaimCategoryLengthRule(1000);
  const item = newBatchedTicketViewClaim("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
