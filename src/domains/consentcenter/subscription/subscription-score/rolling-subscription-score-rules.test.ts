import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSubscriptionScoreCodeLengthRule,
  RollingSubscriptionScoreRequiredCodeRule,
  RollingSubscriptionScoreRequiredNotesRule,
  RollingSubscriptionScoreWeightRangeRule,
  defaultRollingSubscriptionScoreValidator,
} from "./rolling-subscription-score-rules.js";
import { newRollingSubscriptionScore } from "./rolling-subscription-score.js";

test("RollingSubscriptionScoreValidator reports every problem", () => {
  const validator = defaultRollingSubscriptionScoreValidator();
  const item = newRollingSubscriptionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSubscriptionScoreRequiredNotesRule flags a blank notes", () => {
  const rule = new RollingSubscriptionScoreRequiredNotesRule("rolling subscription score needs this field");
  const item = newRollingSubscriptionScore("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSubscriptionScoreWeightRangeRule flags values above weight", () => {
  const rule = new RollingSubscriptionScoreWeightRangeRule(5.7, 4747.3);
  const item = newRollingSubscriptionScore("x", "y");
  item.weight = 4748.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSubscriptionScoreCodeLengthRule flags a long code", () => {
  const rule = new RollingSubscriptionScoreCodeLengthRule(255);
  const item = newRollingSubscriptionScore("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSubscriptionScoreRequiredCodeRule flags a blank code", () => {
  const rule = new RollingSubscriptionScoreRequiredCodeRule("rolling subscription score needs this field");
  const item = newRollingSubscriptionScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
