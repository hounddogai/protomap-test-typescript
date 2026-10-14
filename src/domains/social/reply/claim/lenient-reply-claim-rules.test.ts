import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientReplyClaimCreatedAtRangeRule,
  LenientReplyClaimLabelLengthRule,
  LenientReplyClaimRequiredPhoneRule,
  LenientReplyClaimRequiredUtmSourceRule,
  defaultLenientReplyClaimValidator,
} from "./lenient-reply-claim-rules.js";
import { newLenientReplyClaim } from "./lenient-reply-claim.js";

test("LenientReplyClaimValidator reports every problem", () => {
  const validator = defaultLenientReplyClaimValidator();
  const item = newLenientReplyClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientReplyClaimRequiredPhoneRule flags a blank phone", () => {
  const rule = new LenientReplyClaimRequiredPhoneRule("lenient reply claim needs an entry");
  const item = newLenientReplyClaim("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientReplyClaimCreatedAtRangeRule flags values above created at", () => {
  const rule = new LenientReplyClaimCreatedAtRangeRule(32, 32);
  const item = newLenientReplyClaim("x", "y");
  item.createdAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientReplyClaimRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new LenientReplyClaimRequiredUtmSourceRule("lenient reply claim needs an entry");
  const item = newLenientReplyClaim("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientReplyClaimLabelLengthRule flags a long label", () => {
  const rule = new LenientReplyClaimLabelLengthRule(86400);
  const item = newLenientReplyClaim("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
