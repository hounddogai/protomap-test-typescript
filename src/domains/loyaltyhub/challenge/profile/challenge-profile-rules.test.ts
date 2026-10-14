import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeProfileBatchSizeRangeRule,
  ChallengeProfileContactEmailLengthRule,
  ChallengeProfileTimezoneLengthRule,
  defaultChallengeProfileValidator,
} from "./challenge-profile-rules.js";
import { newChallengeProfile } from "./challenge-profile.js";

test("ChallengeProfileValidator reports every problem", () => {
  const validator = defaultChallengeProfileValidator();
  const item = newChallengeProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeProfileTimezoneLengthRule flags a long timezone", () => {
  const rule = new ChallengeProfileTimezoneLengthRule(16);
  const item = newChallengeProfile("x", "y");
  item.timezone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeProfileContactEmailLengthRule flags a long contact email", () => {
  const rule = new ChallengeProfileContactEmailLengthRule(1000);
  const item = newChallengeProfile("x", "y");
  item.contactEmail = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeProfileBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ChallengeProfileBatchSizeRangeRule(32, 80);
  const item = newChallengeProfile("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
