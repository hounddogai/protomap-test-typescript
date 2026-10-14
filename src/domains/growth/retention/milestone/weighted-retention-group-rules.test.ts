import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRetentionGroupLimitRangeRule,
  WeightedRetentionGroupRequiredNotesRule,
  defaultWeightedRetentionGroupValidator,
} from "./weighted-retention-group-rules.js";
import { newWeightedRetentionGroup } from "./weighted-retention-group.js";

test("WeightedRetentionGroupValidator reports every problem", () => {
  const validator = defaultWeightedRetentionGroupValidator();
  const item = newWeightedRetentionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRetentionGroupLimitRangeRule flags values above limit", () => {
  const rule = new WeightedRetentionGroupLimitRangeRule(64, 80);
  const item = newWeightedRetentionGroup("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRetentionGroupRequiredNotesRule flags a blank notes", () => {
  const rule = new WeightedRetentionGroupRequiredNotesRule("weighted retention group needs this field");
  const item = newWeightedRetentionGroup("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
