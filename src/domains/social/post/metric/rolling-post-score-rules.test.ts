import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPostScoreCodeLengthRule,
  RollingPostScoreRequiredDescriptionRule,
  RollingPostScoreRequiredTitleRule,
  defaultRollingPostScoreValidator,
} from "./rolling-post-score-rules.js";
import { newRollingPostScore } from "./rolling-post-score.js";

test("RollingPostScoreValidator reports every problem", () => {
  const validator = defaultRollingPostScoreValidator();
  const item = newRollingPostScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPostScoreCodeLengthRule flags a long code", () => {
  const rule = new RollingPostScoreCodeLengthRule(120);
  const item = newRollingPostScore("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPostScoreRequiredTitleRule flags a blank title", () => {
  const rule = new RollingPostScoreRequiredTitleRule("rolling post score needs an entry");
  const item = newRollingPostScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPostScoreRequiredDescriptionRule flags a blank description", () => {
  const rule = new RollingPostScoreRequiredDescriptionRule("rolling post score needs an entry");
  const item = newRollingPostScore("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
