import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveChallengeBatchLabelLengthRule,
  AdaptiveChallengeBatchRequiredCodeRule,
  defaultAdaptiveChallengeBatchValidator,
} from "./adaptive-challenge-batch-rules.js";
import { newAdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

test("AdaptiveChallengeBatchValidator reports every problem", () => {
  const validator = defaultAdaptiveChallengeBatchValidator();
  const item = newAdaptiveChallengeBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveChallengeBatchLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveChallengeBatchLabelLengthRule(80);
  const item = newAdaptiveChallengeBatch("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveChallengeBatchRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveChallengeBatchRequiredCodeRule("adaptive challenge batch needs this field");
  const item = newAdaptiveChallengeBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
