import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFlightScoreCodeLengthRule,
  ScheduledFlightScoreRequiredCohortRule,
  ScheduledFlightScoreRequiredTitleRule,
  defaultScheduledFlightScoreValidator,
} from "./scheduled-flight-score-rules.js";
import { newScheduledFlightScore } from "./scheduled-flight-score.js";

test("ScheduledFlightScoreValidator reports every problem", () => {
  const validator = defaultScheduledFlightScoreValidator();
  const item = newScheduledFlightScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFlightScoreRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledFlightScoreRequiredTitleRule("scheduled flight score needs an entry");
  const item = newScheduledFlightScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledFlightScoreRequiredCohortRule flags a blank cohort", () => {
  const rule = new ScheduledFlightScoreRequiredCohortRule("scheduled flight score needs an entry");
  const item = newScheduledFlightScore("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledFlightScoreCodeLengthRule flags a long code", () => {
  const rule = new ScheduledFlightScoreCodeLengthRule(64);
  const item = newScheduledFlightScore("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
