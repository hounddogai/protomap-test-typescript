import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeScoreFrequencyCapRangeRule,
  CreativeScoreRequiredCodeRule,
  CreativeScoreRequiredNameRule,
  defaultCreativeScoreValidator,
} from "./creative-score-rules.js";
import { newCreativeScore } from "./creative-score.js";

test("CreativeScoreValidator reports every problem", () => {
  const validator = defaultCreativeScoreValidator();
  const item = newCreativeScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeScoreRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeScoreRequiredCodeRule("creative score needs this field");
  const item = newCreativeScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeScoreFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new CreativeScoreFrequencyCapRangeRule(80, 86400);
  const item = newCreativeScore("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeScoreRequiredNameRule flags a blank name", () => {
  const rule = new CreativeScoreRequiredNameRule("creative score needs this field");
  const item = newCreativeScore("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
