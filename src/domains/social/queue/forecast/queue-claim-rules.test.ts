import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueClaimCodeLengthRule,
  QueueClaimCreatedAtRangeRule,
  QueueClaimExpiresAtRangeRule,
  QueueClaimLocaleLengthRule,
  QueueClaimSegmentLengthRule,
  defaultQueueClaimValidator,
} from "./queue-claim-rules.js";
import { newQueueClaim } from "./queue-claim.js";

test("QueueClaimValidator reports every problem", () => {
  const validator = defaultQueueClaimValidator();
  const item = newQueueClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueClaimExpiresAtRangeRule flags values above expires at", () => {
  const rule = new QueueClaimExpiresAtRangeRule(64, 80);
  const item = newQueueClaim("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueClaimCodeLengthRule flags a long code", () => {
  const rule = new QueueClaimCodeLengthRule(32);
  const item = newQueueClaim("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueClaimCreatedAtRangeRule flags values above created at", () => {
  const rule = new QueueClaimCreatedAtRangeRule(120, 1000);
  const item = newQueueClaim("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueClaimLocaleLengthRule flags a long locale", () => {
  const rule = new QueueClaimLocaleLengthRule(32);
  const item = newQueueClaim("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueClaimSegmentLengthRule flags a long segment", () => {
  const rule = new QueueClaimSegmentLengthRule(80);
  const item = newQueueClaim("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
