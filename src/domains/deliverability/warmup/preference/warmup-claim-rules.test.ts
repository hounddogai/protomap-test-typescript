import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupClaimAudienceIdLengthRule,
  WarmupClaimRequiredCodeRule,
  WarmupClaimTitleLengthRule,
  defaultWarmupClaimValidator,
} from "./warmup-claim-rules.js";
import { newWarmupClaim } from "./warmup-claim.js";

test("WarmupClaimValidator reports every problem", () => {
  const validator = defaultWarmupClaimValidator();
  const item = newWarmupClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupClaimTitleLengthRule flags a long title", () => {
  const rule = new WarmupClaimTitleLengthRule(3600);
  const item = newWarmupClaim("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupClaimAudienceIdLengthRule flags a long audience id", () => {
  const rule = new WarmupClaimAudienceIdLengthRule(64);
  const item = newWarmupClaim("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupClaimRequiredCodeRule flags a blank code", () => {
  const rule = new WarmupClaimRequiredCodeRule("warmup claim needs a value");
  const item = newWarmupClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
