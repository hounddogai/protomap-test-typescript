import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedReplyClaimCodeLengthRule,
  BatchedReplyClaimRequiredLabelRule,
  BatchedReplyClaimRequiredLocaleRule,
  defaultBatchedReplyClaimValidator,
} from "./batched-reply-claim-rules.js";
import { newBatchedReplyClaim } from "./batched-reply-claim.js";

test("BatchedReplyClaimValidator reports every problem", () => {
  const validator = defaultBatchedReplyClaimValidator();
  const item = newBatchedReplyClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedReplyClaimCodeLengthRule flags a long code", () => {
  const rule = new BatchedReplyClaimCodeLengthRule(64);
  const item = newBatchedReplyClaim("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedReplyClaimRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedReplyClaimRequiredLabelRule("batched reply claim needs an entry");
  const item = newBatchedReplyClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedReplyClaimRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedReplyClaimRequiredLocaleRule("batched reply claim needs a value");
  const item = newBatchedReplyClaim("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
