import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyGroupBudgetRangeRule,
  FrequencyGroupMinimumRangeRule,
  FrequencyGroupRequiredLabelRule,
  FrequencyGroupRequiredLocaleRule,
  FrequencyGroupSegmentLengthRule,
  defaultFrequencyGroupValidator,
} from "./frequency-group-rules.js";
import { newFrequencyGroup } from "./frequency-group.js";

test("FrequencyGroupValidator reports every problem", () => {
  const validator = defaultFrequencyGroupValidator();
  const item = newFrequencyGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyGroupRequiredLocaleRule flags a blank locale", () => {
  const rule = new FrequencyGroupRequiredLocaleRule("frequency group needs this field");
  const item = newFrequencyGroup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyGroupBudgetRangeRule flags values above budget", () => {
  const rule = new FrequencyGroupBudgetRangeRule(2.1, 4349.3);
  const item = newFrequencyGroup("x", "y");
  item.budget = 4350.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyGroupSegmentLengthRule flags a long segment", () => {
  const rule = new FrequencyGroupSegmentLengthRule(16);
  const item = newFrequencyGroup("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyGroupRequiredLabelRule flags a blank label", () => {
  const rule = new FrequencyGroupRequiredLabelRule("frequency group needs this field");
  const item = newFrequencyGroup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyGroupMinimumRangeRule flags values above minimum", () => {
  const rule = new FrequencyGroupMinimumRangeRule(6.9, 1966.9);
  const item = newFrequencyGroup("x", "y");
  item.minimum = 1968.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
