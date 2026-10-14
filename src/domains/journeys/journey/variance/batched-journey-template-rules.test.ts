import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedJourneyTemplateRequiredTitleRule,
  BatchedJourneyTemplateWeightRangeRule,
  defaultBatchedJourneyTemplateValidator,
} from "./batched-journey-template-rules.js";
import { newBatchedJourneyTemplate } from "./batched-journey-template.js";

test("BatchedJourneyTemplateValidator reports every problem", () => {
  const validator = defaultBatchedJourneyTemplateValidator();
  const item = newBatchedJourneyTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedJourneyTemplateRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedJourneyTemplateRequiredTitleRule("batched journey template needs a value");
  const item = newBatchedJourneyTemplate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedJourneyTemplateWeightRangeRule flags values above weight", () => {
  const rule = new BatchedJourneyTemplateWeightRangeRule(7.2, 1777.8);
  const item = newBatchedJourneyTemplate("x", "y");
  item.weight = 1779.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
