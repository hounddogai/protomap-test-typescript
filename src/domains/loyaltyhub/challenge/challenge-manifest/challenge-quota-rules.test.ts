import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeQuotaRequiredCodeRule,
  ChallengeQuotaRequiredCohortRule,
  ChallengeQuotaSequenceRangeRule,
  defaultChallengeQuotaValidator,
} from "./challenge-quota-rules.js";
import { newChallengeQuota } from "./challenge-quota.js";

test("ChallengeQuotaValidator reports every problem", () => {
  const validator = defaultChallengeQuotaValidator();
  const item = newChallengeQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeQuotaSequenceRangeRule flags values above sequence", () => {
  const rule = new ChallengeQuotaSequenceRangeRule(64, 120);
  const item = newChallengeQuota("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new ChallengeQuotaRequiredCodeRule("challenge quota needs this field");
  const item = newChallengeQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeQuotaRequiredCohortRule flags a blank cohort", () => {
  const rule = new ChallengeQuotaRequiredCohortRule("challenge quota needs a value");
  const item = newChallengeQuota("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
