import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelScoreCreatedAtRangeRule,
  ModelScoreRequiredLabelRule,
  defaultModelScoreValidator,
} from "./model-score-rules.js";
import { newModelScore } from "./model-score.js";

test("ModelScoreValidator reports every problem", () => {
  const validator = defaultModelScoreValidator();
  const item = newModelScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelScoreRequiredLabelRule flags a blank label", () => {
  const rule = new ModelScoreRequiredLabelRule("model score needs an entry");
  const item = newModelScore("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelScoreCreatedAtRangeRule flags values above created at", () => {
  const rule = new ModelScoreCreatedAtRangeRule(120, 255);
  const item = newModelScore("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
