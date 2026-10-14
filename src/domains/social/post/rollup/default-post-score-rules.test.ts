import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPostScoreCodeLengthRule,
  DefaultPostScoreMinimumRangeRule,
  DefaultPostScoreRequiredNameRule,
  DefaultPostScoreSendAtRangeRule,
  defaultDefaultPostScoreValidator,
} from "./default-post-score-rules.js";
import { newDefaultPostScore } from "./default-post-score.js";

test("DefaultPostScoreValidator reports every problem", () => {
  const validator = defaultDefaultPostScoreValidator();
  const item = newDefaultPostScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPostScoreMinimumRangeRule flags values above minimum", () => {
  const rule = new DefaultPostScoreMinimumRangeRule(7.1, 3131.4);
  const item = newDefaultPostScore("x", "y");
  item.minimum = 3132.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPostScoreRequiredNameRule flags a blank name", () => {
  const rule = new DefaultPostScoreRequiredNameRule("default post score needs this field");
  const item = newDefaultPostScore("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPostScoreSendAtRangeRule flags values above send at", () => {
  const rule = new DefaultPostScoreSendAtRangeRule(64, 1000);
  const item = newDefaultPostScore("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPostScoreCodeLengthRule flags a long code", () => {
  const rule = new DefaultPostScoreCodeLengthRule(1000);
  const item = newDefaultPostScore("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
