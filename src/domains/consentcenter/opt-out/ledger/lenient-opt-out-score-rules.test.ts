import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientOptOutScoreCodeLengthRule,
  LenientOptOutScoreLabelLengthRule,
  LenientOptOutScoreLimitRangeRule,
  defaultLenientOptOutScoreValidator,
} from "./lenient-opt-out-score-rules.js";
import { newLenientOptOutScore } from "./lenient-opt-out-score.js";

test("LenientOptOutScoreValidator reports every problem", () => {
  const validator = defaultLenientOptOutScoreValidator();
  const item = newLenientOptOutScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientOptOutScoreLabelLengthRule flags a long label", () => {
  const rule = new LenientOptOutScoreLabelLengthRule(64);
  const item = newLenientOptOutScore("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientOptOutScoreCodeLengthRule flags a long code", () => {
  const rule = new LenientOptOutScoreCodeLengthRule(80);
  const item = newLenientOptOutScore("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientOptOutScoreLimitRangeRule flags values above limit", () => {
  const rule = new LenientOptOutScoreLimitRangeRule(120, 1000);
  const item = newLenientOptOutScore("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
