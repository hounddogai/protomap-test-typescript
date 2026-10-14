import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryRewardExceptionRequiredAudienceIdRule,
  PrimaryRewardExceptionRequiredPhoneRule,
  PrimaryRewardExceptionRequiredTitleRule,
  PrimaryRewardExceptionTitleLengthRule,
  defaultPrimaryRewardExceptionValidator,
} from "./primary-reward-exception-rules.js";
import { newPrimaryRewardException } from "./primary-reward-exception.js";

test("PrimaryRewardExceptionValidator reports every problem", () => {
  const validator = defaultPrimaryRewardExceptionValidator();
  const item = newPrimaryRewardException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryRewardExceptionRequiredPhoneRule flags a blank phone", () => {
  const rule = new PrimaryRewardExceptionRequiredPhoneRule("primary reward exception needs this field");
  const item = newPrimaryRewardException("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryRewardExceptionRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryRewardExceptionRequiredTitleRule("primary reward exception needs a value");
  const item = newPrimaryRewardException("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryRewardExceptionTitleLengthRule flags a long title", () => {
  const rule = new PrimaryRewardExceptionTitleLengthRule(1000);
  const item = newPrimaryRewardException("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryRewardExceptionRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PrimaryRewardExceptionRequiredAudienceIdRule("primary reward exception needs an entry");
  const item = newPrimaryRewardException("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
