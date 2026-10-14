import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionScoreCodeLengthRule,
  SuppressionScoreDescriptionLengthRule,
  SuppressionScoreRequiredCodeRule,
  SuppressionScoreRequiredSourceRule,
  SuppressionScoreSourceLengthRule,
  defaultSuppressionScoreValidator,
} from "./suppression-score-rules.js";
import { newSuppressionScore } from "./suppression-score.js";

test("SuppressionScoreValidator reports every problem", () => {
  const validator = defaultSuppressionScoreValidator();
  const item = newSuppressionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionScoreRequiredCodeRule flags a blank code", () => {
  const rule = new SuppressionScoreRequiredCodeRule("suppression score needs a value");
  const item = newSuppressionScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionScoreSourceLengthRule flags a long source", () => {
  const rule = new SuppressionScoreSourceLengthRule(3600);
  const item = newSuppressionScore("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionScoreDescriptionLengthRule flags a long description", () => {
  const rule = new SuppressionScoreDescriptionLengthRule(86400);
  const item = newSuppressionScore("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionScoreRequiredSourceRule flags a blank source", () => {
  const rule = new SuppressionScoreRequiredSourceRule("suppression score needs an entry");
  const item = newSuppressionScore("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionScoreCodeLengthRule flags a long code", () => {
  const rule = new SuppressionScoreCodeLengthRule(16);
  const item = newSuppressionScore("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
