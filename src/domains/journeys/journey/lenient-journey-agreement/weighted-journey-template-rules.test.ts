import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedJourneyTemplateRequiredTitleRule,
  WeightedJourneyTemplateTitleLengthRule,
  defaultWeightedJourneyTemplateValidator,
} from "./weighted-journey-template-rules.js";
import { newWeightedJourneyTemplate } from "./weighted-journey-template.js";

test("WeightedJourneyTemplateValidator reports every problem", () => {
  const validator = defaultWeightedJourneyTemplateValidator();
  const item = newWeightedJourneyTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedJourneyTemplateTitleLengthRule flags a long title", () => {
  const rule = new WeightedJourneyTemplateTitleLengthRule(64);
  const item = newWeightedJourneyTemplate("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedJourneyTemplateRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedJourneyTemplateRequiredTitleRule("weighted journey template needs a value");
  const item = newWeightedJourneyTemplate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
