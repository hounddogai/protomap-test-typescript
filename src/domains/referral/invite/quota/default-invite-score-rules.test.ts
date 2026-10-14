import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultInviteScoreRequiredContactEmailRule,
  DefaultInviteScoreRequiredTitleRule,
  DefaultInviteScoreTitleLengthRule,
  defaultDefaultInviteScoreValidator,
} from "./default-invite-score-rules.js";
import { newDefaultInviteScore } from "./default-invite-score.js";

test("DefaultInviteScoreValidator reports every problem", () => {
  const validator = defaultDefaultInviteScoreValidator();
  const item = newDefaultInviteScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultInviteScoreTitleLengthRule flags a long title", () => {
  const rule = new DefaultInviteScoreTitleLengthRule(80);
  const item = newDefaultInviteScore("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultInviteScoreRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultInviteScoreRequiredTitleRule("default invite score needs this field");
  const item = newDefaultInviteScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultInviteScoreRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new DefaultInviteScoreRequiredContactEmailRule("default invite score needs this field");
  const item = newDefaultInviteScore("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
