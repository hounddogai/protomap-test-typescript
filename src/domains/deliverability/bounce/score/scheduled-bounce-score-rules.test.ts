import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledBounceScoreCodeLengthRule,
  ScheduledBounceScoreCreatedAtRangeRule,
  ScheduledBounceScoreRequiredCategoryRule,
  ScheduledBounceScoreTitleLengthRule,
  defaultScheduledBounceScoreValidator,
} from "./scheduled-bounce-score-rules.js";
import { newScheduledBounceScore } from "./scheduled-bounce-score.js";

test("ScheduledBounceScoreValidator reports every problem", () => {
  const validator = defaultScheduledBounceScoreValidator();
  const item = newScheduledBounceScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledBounceScoreRequiredCategoryRule flags a blank category", () => {
  const rule = new ScheduledBounceScoreRequiredCategoryRule("scheduled bounce score needs an entry");
  const item = newScheduledBounceScore("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledBounceScoreCodeLengthRule flags a long code", () => {
  const rule = new ScheduledBounceScoreCodeLengthRule(120);
  const item = newScheduledBounceScore("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledBounceScoreTitleLengthRule flags a long title", () => {
  const rule = new ScheduledBounceScoreTitleLengthRule(3600);
  const item = newScheduledBounceScore("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledBounceScoreCreatedAtRangeRule flags values above created at", () => {
  const rule = new ScheduledBounceScoreCreatedAtRangeRule(120, 255);
  const item = newScheduledBounceScore("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
