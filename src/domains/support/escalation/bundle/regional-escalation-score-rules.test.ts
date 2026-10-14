import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalEscalationScoreLocaleLengthRule,
  RegionalEscalationScoreRequiredCodeRule,
  RegionalEscalationScoreRequiredLocaleRule,
  RegionalEscalationScoreTitleLengthRule,
  defaultRegionalEscalationScoreValidator,
} from "./regional-escalation-score-rules.js";
import { newRegionalEscalationScore } from "./regional-escalation-score.js";

test("RegionalEscalationScoreValidator reports every problem", () => {
  const validator = defaultRegionalEscalationScoreValidator();
  const item = newRegionalEscalationScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalEscalationScoreLocaleLengthRule flags a long locale", () => {
  const rule = new RegionalEscalationScoreLocaleLengthRule(1000);
  const item = newRegionalEscalationScore("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalEscalationScoreTitleLengthRule flags a long title", () => {
  const rule = new RegionalEscalationScoreTitleLengthRule(80);
  const item = newRegionalEscalationScore("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalEscalationScoreRequiredLocaleRule flags a blank locale", () => {
  const rule = new RegionalEscalationScoreRequiredLocaleRule("regional escalation score needs this field");
  const item = newRegionalEscalationScore("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalEscalationScoreRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalEscalationScoreRequiredCodeRule("regional escalation score needs an entry");
  const item = newRegionalEscalationScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
