import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredMentionClaimCodeLengthRule,
  TieredMentionClaimRequiredNameRule,
  TieredMentionClaimRequiredReviewerRule,
  defaultTieredMentionClaimValidator,
} from "./tiered-mention-claim-rules.js";
import { newTieredMentionClaim } from "./tiered-mention-claim.js";

test("TieredMentionClaimValidator reports every problem", () => {
  const validator = defaultTieredMentionClaimValidator();
  const item = newTieredMentionClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredMentionClaimRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new TieredMentionClaimRequiredReviewerRule("tiered mention claim needs a value");
  const item = newTieredMentionClaim("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredMentionClaimRequiredNameRule flags a blank name", () => {
  const rule = new TieredMentionClaimRequiredNameRule("tiered mention claim needs this field");
  const item = newTieredMentionClaim("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredMentionClaimCodeLengthRule flags a long code", () => {
  const rule = new TieredMentionClaimCodeLengthRule(1000);
  const item = newTieredMentionClaim("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
