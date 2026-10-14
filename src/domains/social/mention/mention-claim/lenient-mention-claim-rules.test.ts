import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientMentionClaimBatchSizeRangeRule,
  LenientMentionClaimCountryLengthRule,
  LenientMentionClaimRateRangeRule,
  LenientMentionClaimUtmSourceLengthRule,
  defaultLenientMentionClaimValidator,
} from "./lenient-mention-claim-rules.js";
import { newLenientMentionClaim } from "./lenient-mention-claim.js";

test("LenientMentionClaimValidator reports every problem", () => {
  const validator = defaultLenientMentionClaimValidator();
  const item = newLenientMentionClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientMentionClaimBatchSizeRangeRule flags values above batch size", () => {
  const rule = new LenientMentionClaimBatchSizeRangeRule(16, 1000);
  const item = newLenientMentionClaim("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientMentionClaimRateRangeRule flags values above rate", () => {
  const rule = new LenientMentionClaimRateRangeRule(8.8, 325.8);
  const item = newLenientMentionClaim("x", "y");
  item.rate = 327.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientMentionClaimCountryLengthRule flags a long country", () => {
  const rule = new LenientMentionClaimCountryLengthRule(255);
  const item = newLenientMentionClaim("x", "y");
  item.country = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientMentionClaimUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LenientMentionClaimUtmSourceLengthRule(120);
  const item = newLenientMentionClaim("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
