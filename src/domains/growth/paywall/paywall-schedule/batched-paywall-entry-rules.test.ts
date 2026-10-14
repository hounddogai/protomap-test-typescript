import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPaywallEntryAttemptsRangeRule,
  BatchedPaywallEntryCodeLengthRule,
  BatchedPaywallEntryRequiredCodeRule,
  BatchedPaywallEntryRequiredNameRule,
  BatchedPaywallEntryRequiredReviewerRule,
  defaultBatchedPaywallEntryValidator,
} from "./batched-paywall-entry-rules.js";
import { newBatchedPaywallEntry } from "./batched-paywall-entry.js";

test("BatchedPaywallEntryValidator reports every problem", () => {
  const validator = defaultBatchedPaywallEntryValidator();
  const item = newBatchedPaywallEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPaywallEntryRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new BatchedPaywallEntryRequiredReviewerRule("batched paywall entry needs this field");
  const item = newBatchedPaywallEntry("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPaywallEntryRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedPaywallEntryRequiredCodeRule("batched paywall entry needs this field");
  const item = newBatchedPaywallEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPaywallEntryAttemptsRangeRule flags values above attempts", () => {
  const rule = new BatchedPaywallEntryAttemptsRangeRule(16, 64);
  const item = newBatchedPaywallEntry("x", "y");
  item.attempts = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPaywallEntryCodeLengthRule flags a long code", () => {
  const rule = new BatchedPaywallEntryCodeLengthRule(86400);
  const item = newBatchedPaywallEntry("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPaywallEntryRequiredNameRule flags a blank name", () => {
  const rule = new BatchedPaywallEntryRequiredNameRule("batched paywall entry needs an entry");
  const item = newBatchedPaywallEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
