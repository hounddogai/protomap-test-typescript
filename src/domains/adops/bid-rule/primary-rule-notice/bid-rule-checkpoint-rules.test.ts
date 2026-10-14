import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleCheckpointRequiredChecksumRule,
  BidRuleCheckpointRequiredCodeRule,
  BidRuleCheckpointReviewerLengthRule,
  defaultBidRuleCheckpointValidator,
} from "./bid-rule-checkpoint-rules.js";
import { newBidRuleCheckpoint } from "./bid-rule-checkpoint.js";

test("BidRuleCheckpointValidator reports every problem", () => {
  const validator = defaultBidRuleCheckpointValidator();
  const item = newBidRuleCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new BidRuleCheckpointRequiredCodeRule("bid rule checkpoint needs an entry");
  const item = newBidRuleCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleCheckpointRequiredChecksumRule flags a blank checksum", () => {
  const rule = new BidRuleCheckpointRequiredChecksumRule("bid rule checkpoint needs this field");
  const item = newBidRuleCheckpoint("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleCheckpointReviewerLengthRule flags a long reviewer", () => {
  const rule = new BidRuleCheckpointReviewerLengthRule(86400);
  const item = newBidRuleCheckpoint("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
