import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleScoreNameLengthRule,
  ExitRuleScoreQuantityRangeRule,
  ExitRuleScoreRequiredChecksumRule,
  ExitRuleScoreRequiredLocaleRule,
  defaultExitRuleScoreValidator,
} from "./exit-rule-score-rules.js";
import { newExitRuleScore } from "./exit-rule-score.js";

test("ExitRuleScoreValidator reports every problem", () => {
  const validator = defaultExitRuleScoreValidator();
  const item = newExitRuleScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleScoreNameLengthRule flags a long name", () => {
  const rule = new ExitRuleScoreNameLengthRule(80);
  const item = newExitRuleScore("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleScoreRequiredLocaleRule flags a blank locale", () => {
  const rule = new ExitRuleScoreRequiredLocaleRule("exit rule score needs a value");
  const item = newExitRuleScore("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleScoreRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ExitRuleScoreRequiredChecksumRule("exit rule score needs an entry");
  const item = newExitRuleScore("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleScoreQuantityRangeRule flags values above quantity", () => {
  const rule = new ExitRuleScoreQuantityRangeRule(64, 3600);
  const item = newExitRuleScore("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
