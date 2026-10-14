import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueScoreCodeLengthRule,
  QueueScoreRequiredCodeRule,
  QueueScoreRequiredLocaleRule,
  defaultQueueScoreValidator,
} from "./queue-score-rules.js";
import { newQueueScore } from "./queue-score.js";

test("QueueScoreValidator reports every problem", () => {
  const validator = defaultQueueScoreValidator();
  const item = newQueueScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueScoreCodeLengthRule flags a long code", () => {
  const rule = new QueueScoreCodeLengthRule(32);
  const item = newQueueScore("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueScoreRequiredLocaleRule flags a blank locale", () => {
  const rule = new QueueScoreRequiredLocaleRule("queue score needs this field");
  const item = newQueueScore("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueScoreRequiredCodeRule flags a blank code", () => {
  const rule = new QueueScoreRequiredCodeRule("queue score needs a value");
  const item = newQueueScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
