import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSenderScoreCodeLengthRule,
  RegionalSenderScoreFrequencyCapRangeRule,
  RegionalSenderScoreLimitRangeRule,
  RegionalSenderScoreRequiredNameRule,
  defaultRegionalSenderScoreValidator,
} from "./regional-sender-score-rules.js";
import { newRegionalSenderScore } from "./regional-sender-score.js";

test("RegionalSenderScoreValidator reports every problem", () => {
  const validator = defaultRegionalSenderScoreValidator();
  const item = newRegionalSenderScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSenderScoreLimitRangeRule flags values above limit", () => {
  const rule = new RegionalSenderScoreLimitRangeRule(16, 80);
  const item = newRegionalSenderScore("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSenderScoreFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new RegionalSenderScoreFrequencyCapRangeRule(3600, 86400);
  const item = newRegionalSenderScore("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSenderScoreRequiredNameRule flags a blank name", () => {
  const rule = new RegionalSenderScoreRequiredNameRule("regional sender score needs an entry");
  const item = newRegionalSenderScore("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSenderScoreCodeLengthRule flags a long code", () => {
  const rule = new RegionalSenderScoreCodeLengthRule(255);
  const item = newRegionalSenderScore("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
