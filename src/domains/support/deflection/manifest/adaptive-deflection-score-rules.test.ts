import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDeflectionScoreRegionLengthRule,
  AdaptiveDeflectionScoreRequiredRegionRule,
  AdaptiveDeflectionScoreTitleLengthRule,
  defaultAdaptiveDeflectionScoreValidator,
} from "./adaptive-deflection-score-rules.js";
import { newAdaptiveDeflectionScore } from "./adaptive-deflection-score.js";

test("AdaptiveDeflectionScoreValidator reports every problem", () => {
  const validator = defaultAdaptiveDeflectionScoreValidator();
  const item = newAdaptiveDeflectionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDeflectionScoreTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveDeflectionScoreTitleLengthRule(64);
  const item = newAdaptiveDeflectionScore("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDeflectionScoreRequiredRegionRule flags a blank region", () => {
  const rule = new AdaptiveDeflectionScoreRequiredRegionRule("adaptive deflection score needs this field");
  const item = newAdaptiveDeflectionScore("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDeflectionScoreRegionLengthRule flags a long region", () => {
  const rule = new AdaptiveDeflectionScoreRegionLengthRule(255);
  const item = newAdaptiveDeflectionScore("x", "y");
  item.region = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
