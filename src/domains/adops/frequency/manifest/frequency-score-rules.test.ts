import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyScoreLabelLengthRule,
  FrequencyScoreRequiredAudienceIdRule,
  FrequencyScoreRequiredCodeRule,
  FrequencyScoreSegmentLengthRule,
  defaultFrequencyScoreValidator,
} from "./frequency-score-rules.js";
import { newFrequencyScore } from "./frequency-score.js";

test("FrequencyScoreValidator reports every problem", () => {
  const validator = defaultFrequencyScoreValidator();
  const item = newFrequencyScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyScoreRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new FrequencyScoreRequiredAudienceIdRule("frequency score needs a value");
  const item = newFrequencyScore("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyScoreRequiredCodeRule flags a blank code", () => {
  const rule = new FrequencyScoreRequiredCodeRule("frequency score needs an entry");
  const item = newFrequencyScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyScoreLabelLengthRule flags a long label", () => {
  const rule = new FrequencyScoreLabelLengthRule(16);
  const item = newFrequencyScore("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyScoreSegmentLengthRule flags a long segment", () => {
  const rule = new FrequencyScoreSegmentLengthRule(64);
  const item = newFrequencyScore("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
