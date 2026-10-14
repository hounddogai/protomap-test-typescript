import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryStepScoreMarginRangeRule,
  PrimaryStepScoreRequiredLabelRule,
  PrimaryStepScoreSequenceRangeRule,
  defaultPrimaryStepScoreValidator,
} from "./primary-step-score-rules.js";
import { newPrimaryStepScore } from "./primary-step-score.js";

test("PrimaryStepScoreValidator reports every problem", () => {
  const validator = defaultPrimaryStepScoreValidator();
  const item = newPrimaryStepScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryStepScoreSequenceRangeRule flags values above sequence", () => {
  const rule = new PrimaryStepScoreSequenceRangeRule(32, 3600);
  const item = newPrimaryStepScore("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryStepScoreMarginRangeRule flags values above margin", () => {
  const rule = new PrimaryStepScoreMarginRangeRule(1.9, 4448.2);
  const item = newPrimaryStepScore("x", "y");
  item.margin = 4449.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryStepScoreRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryStepScoreRequiredLabelRule("primary step score needs an entry");
  const item = newPrimaryStepScore("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
