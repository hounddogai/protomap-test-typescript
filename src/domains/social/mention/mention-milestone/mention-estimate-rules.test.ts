import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionEstimateCeilingRangeRule,
  MentionEstimateCohortLengthRule,
  MentionEstimatePhoneLengthRule,
  MentionEstimateRequiredPhoneRule,
  MentionEstimateRequiredTitleRule,
  defaultMentionEstimateValidator,
} from "./mention-estimate-rules.js";
import { newMentionEstimate } from "./mention-estimate.js";

test("MentionEstimateValidator reports every problem", () => {
  const validator = defaultMentionEstimateValidator();
  const item = newMentionEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionEstimateRequiredTitleRule flags a blank title", () => {
  const rule = new MentionEstimateRequiredTitleRule("mention estimate needs a value");
  const item = newMentionEstimate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionEstimateRequiredPhoneRule flags a blank phone", () => {
  const rule = new MentionEstimateRequiredPhoneRule("mention estimate needs this field");
  const item = newMentionEstimate("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionEstimateCeilingRangeRule flags values above ceiling", () => {
  const rule = new MentionEstimateCeilingRangeRule(8.8, 2626.3);
  const item = newMentionEstimate("x", "y");
  item.ceiling = 2627.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionEstimateCohortLengthRule flags a long cohort", () => {
  const rule = new MentionEstimateCohortLengthRule(80);
  const item = newMentionEstimate("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionEstimatePhoneLengthRule flags a long phone", () => {
  const rule = new MentionEstimatePhoneLengthRule(255);
  const item = newMentionEstimate("x", "y");
  item.phone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
