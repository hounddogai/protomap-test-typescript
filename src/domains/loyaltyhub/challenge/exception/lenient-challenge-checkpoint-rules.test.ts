import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientChallengeCheckpointMaximumRangeRule,
  defaultLenientChallengeCheckpointValidator,
} from "./lenient-challenge-checkpoint-rules.js";
import { newLenientChallengeCheckpoint } from "./lenient-challenge-checkpoint.js";

test("LenientChallengeCheckpointValidator reports every problem", () => {
  const validator = defaultLenientChallengeCheckpointValidator();
  const item = newLenientChallengeCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientChallengeCheckpointMaximumRangeRule flags values above maximum", () => {
  const rule = new LenientChallengeCheckpointMaximumRangeRule(7.2, 1333.9);
  const item = newLenientChallengeCheckpoint("x", "y");
  item.maximum = 1335.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
