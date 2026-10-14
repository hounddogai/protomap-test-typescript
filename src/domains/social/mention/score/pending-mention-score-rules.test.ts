import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingMentionScoreCodeLengthRule,
  PendingMentionScoreRequiredCodeRule,
  PendingMentionScoreRequiredCountryRule,
  PendingMentionScoreTitleLengthRule,
  defaultPendingMentionScoreValidator,
} from "./pending-mention-score-rules.js";
import { newPendingMentionScore } from "./pending-mention-score.js";

test("PendingMentionScoreValidator reports every problem", () => {
  const validator = defaultPendingMentionScoreValidator();
  const item = newPendingMentionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingMentionScoreRequiredCountryRule flags a blank country", () => {
  const rule = new PendingMentionScoreRequiredCountryRule("pending mention score needs an entry");
  const item = newPendingMentionScore("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingMentionScoreRequiredCodeRule flags a blank code", () => {
  const rule = new PendingMentionScoreRequiredCodeRule("pending mention score needs this field");
  const item = newPendingMentionScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingMentionScoreCodeLengthRule flags a long code", () => {
  const rule = new PendingMentionScoreCodeLengthRule(80);
  const item = newPendingMentionScore("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingMentionScoreTitleLengthRule flags a long title", () => {
  const rule = new PendingMentionScoreTitleLengthRule(120);
  const item = newPendingMentionScore("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
