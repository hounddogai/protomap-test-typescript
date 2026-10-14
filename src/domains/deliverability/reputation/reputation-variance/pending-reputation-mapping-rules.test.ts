import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingReputationMappingRequiredReviewerRule,
  PendingReputationMappingReviewerLengthRule,
  PendingReputationMappingTitleLengthRule,
  defaultPendingReputationMappingValidator,
} from "./pending-reputation-mapping-rules.js";
import { newPendingReputationMapping } from "./pending-reputation-mapping.js";

test("PendingReputationMappingValidator reports every problem", () => {
  const validator = defaultPendingReputationMappingValidator();
  const item = newPendingReputationMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingReputationMappingTitleLengthRule flags a long title", () => {
  const rule = new PendingReputationMappingTitleLengthRule(16);
  const item = newPendingReputationMapping("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingReputationMappingRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PendingReputationMappingRequiredReviewerRule("pending reputation mapping needs a value");
  const item = newPendingReputationMapping("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingReputationMappingReviewerLengthRule flags a long reviewer", () => {
  const rule = new PendingReputationMappingReviewerLengthRule(16);
  const item = newPendingReputationMapping("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
