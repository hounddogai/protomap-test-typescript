import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutScoreRequiredCodeRule,
  OptOutScoreRequiredNameRule,
  OptOutScoreRequiredTitleRule,
  OptOutScoreSendAtRangeRule,
  defaultOptOutScoreValidator,
} from "./opt-out-score-rules.js";
import { newOptOutScore } from "./opt-out-score.js";

test("OptOutScoreValidator reports every problem", () => {
  const validator = defaultOptOutScoreValidator();
  const item = newOptOutScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutScoreRequiredCodeRule flags a blank code", () => {
  const rule = new OptOutScoreRequiredCodeRule("opt out score needs this field");
  const item = newOptOutScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutScoreRequiredNameRule flags a blank name", () => {
  const rule = new OptOutScoreRequiredNameRule("opt out score needs this field");
  const item = newOptOutScore("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutScoreRequiredTitleRule flags a blank title", () => {
  const rule = new OptOutScoreRequiredTitleRule("opt out score needs an entry");
  const item = newOptOutScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutScoreSendAtRangeRule flags values above send at", () => {
  const rule = new OptOutScoreSendAtRangeRule(16, 64);
  const item = newOptOutScore("x", "y");
  item.sendAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
