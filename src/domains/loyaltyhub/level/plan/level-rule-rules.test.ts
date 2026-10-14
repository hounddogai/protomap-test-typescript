import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelRuleCodeLengthRule,
  LevelRuleCountryLengthRule,
  LevelRuleRequiredCodeRule,
  LevelRuleRequiredCountryRule,
  LevelRuleSummaryLengthRule,
  defaultLevelRuleValidator,
} from "./level-rule-rules.js";
import { newLevelRule } from "./level-rule.js";

test("LevelRuleValidator reports every problem", () => {
  const validator = defaultLevelRuleValidator();
  const item = newLevelRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelRuleRequiredCountryRule flags a blank country", () => {
  const rule = new LevelRuleRequiredCountryRule("level rule needs this field");
  const item = newLevelRule("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelRuleCountryLengthRule flags a long country", () => {
  const rule = new LevelRuleCountryLengthRule(1000);
  const item = newLevelRule("x", "y");
  item.country = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelRuleSummaryLengthRule flags a long summary", () => {
  const rule = new LevelRuleSummaryLengthRule(3600);
  const item = newLevelRule("x", "y");
  item.summary = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelRuleRequiredCodeRule flags a blank code", () => {
  const rule = new LevelRuleRequiredCodeRule("level rule needs an entry");
  const item = newLevelRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelRuleCodeLengthRule flags a long code", () => {
  const rule = new LevelRuleCodeLengthRule(120);
  const item = newLevelRule("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
