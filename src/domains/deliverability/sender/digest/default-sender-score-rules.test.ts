import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultSenderScoreRequiredTitleRule,
  DefaultSenderScoreStartsAtRangeRule,
  DefaultSenderScoreTitleLengthRule,
  defaultDefaultSenderScoreValidator,
} from "./default-sender-score-rules.js";
import { newDefaultSenderScore } from "./default-sender-score.js";

test("DefaultSenderScoreValidator reports every problem", () => {
  const validator = defaultDefaultSenderScoreValidator();
  const item = newDefaultSenderScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultSenderScoreTitleLengthRule flags a long title", () => {
  const rule = new DefaultSenderScoreTitleLengthRule(86400);
  const item = newDefaultSenderScore("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultSenderScoreRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultSenderScoreRequiredTitleRule("default sender score needs an entry");
  const item = newDefaultSenderScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultSenderScoreStartsAtRangeRule flags values above starts at", () => {
  const rule = new DefaultSenderScoreStartsAtRangeRule(120, 86400);
  const item = newDefaultSenderScore("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
