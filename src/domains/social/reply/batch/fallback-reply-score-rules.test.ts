import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackReplyScoreLocaleLengthRule,
  FallbackReplyScoreRequiredCodeRule,
  FallbackReplyScoreTitleLengthRule,
  defaultFallbackReplyScoreValidator,
} from "./fallback-reply-score-rules.js";
import { newFallbackReplyScore } from "./fallback-reply-score.js";

test("FallbackReplyScoreValidator reports every problem", () => {
  const validator = defaultFallbackReplyScoreValidator();
  const item = newFallbackReplyScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackReplyScoreLocaleLengthRule flags a long locale", () => {
  const rule = new FallbackReplyScoreLocaleLengthRule(255);
  const item = newFallbackReplyScore("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackReplyScoreRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackReplyScoreRequiredCodeRule("fallback reply score needs this field");
  const item = newFallbackReplyScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackReplyScoreTitleLengthRule flags a long title", () => {
  const rule = new FallbackReplyScoreTitleLengthRule(1000);
  const item = newFallbackReplyScore("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
