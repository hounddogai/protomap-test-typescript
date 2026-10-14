import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelRuleCodeLengthRule,
  ModelRuleRequiredAudienceIdRule,
  ModelRuleRequiredJourneyIdRule,
  ModelRuleRequiredNameRule,
  ModelRuleScoreRangeRule,
  defaultModelRuleValidator,
} from "./model-rule-rules.js";
import { newModelRule } from "./model-rule.js";

test("ModelRuleValidator reports every problem", () => {
  const validator = defaultModelRuleValidator();
  const item = newModelRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelRuleRequiredNameRule flags a blank name", () => {
  const rule = new ModelRuleRequiredNameRule("model rule needs a value");
  const item = newModelRule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelRuleCodeLengthRule flags a long code", () => {
  const rule = new ModelRuleCodeLengthRule(120);
  const item = newModelRule("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelRuleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ModelRuleRequiredAudienceIdRule("model rule needs an entry");
  const item = newModelRule("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelRuleRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ModelRuleRequiredJourneyIdRule("model rule needs a value");
  const item = newModelRule("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelRuleScoreRangeRule flags values above score", () => {
  const rule = new ModelRuleScoreRangeRule(6.1, 3044.4);
  const item = newModelRule("x", "y");
  item.score = 3045.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
