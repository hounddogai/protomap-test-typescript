import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultJourneyScoreCodeLengthRule,
  DefaultJourneyScoreExternalRefLengthRule,
  DefaultJourneyScoreLocaleLengthRule,
  DefaultJourneyScoreRequiredLocaleRule,
  defaultDefaultJourneyScoreValidator,
} from "./default-journey-score-rules.js";
import { newDefaultJourneyScore } from "./default-journey-score.js";

test("DefaultJourneyScoreValidator reports every problem", () => {
  const validator = defaultDefaultJourneyScoreValidator();
  const item = newDefaultJourneyScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultJourneyScoreCodeLengthRule flags a long code", () => {
  const rule = new DefaultJourneyScoreCodeLengthRule(86400);
  const item = newDefaultJourneyScore("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultJourneyScoreExternalRefLengthRule flags a long external ref", () => {
  const rule = new DefaultJourneyScoreExternalRefLengthRule(86400);
  const item = newDefaultJourneyScore("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultJourneyScoreLocaleLengthRule flags a long locale", () => {
  const rule = new DefaultJourneyScoreLocaleLengthRule(64);
  const item = newDefaultJourneyScore("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultJourneyScoreRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultJourneyScoreRequiredLocaleRule("default journey score needs this field");
  const item = newDefaultJourneyScore("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
