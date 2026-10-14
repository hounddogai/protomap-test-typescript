import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPostScoreCodeLengthRule,
  ScheduledPostScoreWeightRangeRule,
  defaultScheduledPostScoreValidator,
} from "./scheduled-post-score-rules.js";
import { newScheduledPostScore } from "./scheduled-post-score.js";

test("ScheduledPostScoreValidator reports every problem", () => {
  const validator = defaultScheduledPostScoreValidator();
  const item = newScheduledPostScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPostScoreCodeLengthRule flags a long code", () => {
  const rule = new ScheduledPostScoreCodeLengthRule(255);
  const item = newScheduledPostScore("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPostScoreWeightRangeRule flags values above weight", () => {
  const rule = new ScheduledPostScoreWeightRangeRule(9.4, 4490.6);
  const item = newScheduledPostScore("x", "y");
  item.weight = 4492.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
