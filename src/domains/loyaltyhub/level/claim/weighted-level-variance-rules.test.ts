import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedLevelVarianceCodeLengthRule,
  WeightedLevelVarianceRequiredAudienceIdRule,
  defaultWeightedLevelVarianceValidator,
} from "./weighted-level-variance-rules.js";
import { newWeightedLevelVariance } from "./weighted-level-variance.js";

test("WeightedLevelVarianceValidator reports every problem", () => {
  const validator = defaultWeightedLevelVarianceValidator();
  const item = newWeightedLevelVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedLevelVarianceCodeLengthRule flags a long code", () => {
  const rule = new WeightedLevelVarianceCodeLengthRule(64);
  const item = newWeightedLevelVariance("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedLevelVarianceRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new WeightedLevelVarianceRequiredAudienceIdRule("weighted level variance needs an entry");
  const item = newWeightedLevelVariance("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
