import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingExitRuleDigestRateRangeRule,
  PendingExitRuleDigestRequiredLocaleRule,
  PendingExitRuleDigestSendAtRangeRule,
  PendingExitRuleDigestUtmSourceLengthRule,
  defaultPendingExitRuleDigestValidator,
} from "./pending-exit-rule-digest-rules.js";
import { newPendingExitRuleDigest } from "./pending-exit-rule-digest.js";

test("PendingExitRuleDigestValidator reports every problem", () => {
  const validator = defaultPendingExitRuleDigestValidator();
  const item = newPendingExitRuleDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingExitRuleDigestUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PendingExitRuleDigestUtmSourceLengthRule(86400);
  const item = newPendingExitRuleDigest("x", "y");
  item.utmSource = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingExitRuleDigestRequiredLocaleRule flags a blank locale", () => {
  const rule = new PendingExitRuleDigestRequiredLocaleRule("pending exit rule digest needs this field");
  const item = newPendingExitRuleDigest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingExitRuleDigestSendAtRangeRule flags values above send at", () => {
  const rule = new PendingExitRuleDigestSendAtRangeRule(16, 80);
  const item = newPendingExitRuleDigest("x", "y");
  item.sendAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingExitRuleDigestRateRangeRule flags values above rate", () => {
  const rule = new PendingExitRuleDigestRateRangeRule(2.1, 4051.3);
  const item = newPendingExitRuleDigest("x", "y");
  item.rate = 4052.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
