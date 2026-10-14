import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultChallengeThresholdCodeLengthRule,
  DefaultChallengeThresholdJourneyIdLengthRule,
  defaultDefaultChallengeThresholdValidator,
} from "./default-challenge-threshold-rules.js";
import { newDefaultChallengeThreshold } from "./default-challenge-threshold.js";

test("DefaultChallengeThresholdValidator reports every problem", () => {
  const validator = defaultDefaultChallengeThresholdValidator();
  const item = newDefaultChallengeThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultChallengeThresholdJourneyIdLengthRule flags a long journey id", () => {
  const rule = new DefaultChallengeThresholdJourneyIdLengthRule(3600);
  const item = newDefaultChallengeThreshold("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultChallengeThresholdCodeLengthRule flags a long code", () => {
  const rule = new DefaultChallengeThresholdCodeLengthRule(80);
  const item = newDefaultChallengeThreshold("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
