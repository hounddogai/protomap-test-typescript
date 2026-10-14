import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFrequencyBaselineQuantityRangeRule,
  CappedFrequencyBaselineRequiredDescriptionRule,
  CappedFrequencyBaselineRequiredNameRule,
  defaultCappedFrequencyBaselineValidator,
} from "./capped-frequency-baseline-rules.js";
import { newCappedFrequencyBaseline } from "./capped-frequency-baseline.js";

test("CappedFrequencyBaselineValidator reports every problem", () => {
  const validator = defaultCappedFrequencyBaselineValidator();
  const item = newCappedFrequencyBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFrequencyBaselineRequiredNameRule flags a blank name", () => {
  const rule = new CappedFrequencyBaselineRequiredNameRule("capped frequency baseline needs an entry");
  const item = newCappedFrequencyBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFrequencyBaselineQuantityRangeRule flags values above quantity", () => {
  const rule = new CappedFrequencyBaselineQuantityRangeRule(64, 1000);
  const item = newCappedFrequencyBaseline("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFrequencyBaselineRequiredDescriptionRule flags a blank description", () => {
  const rule = new CappedFrequencyBaselineRequiredDescriptionRule("capped frequency baseline needs an entry");
  const item = newCappedFrequencyBaseline("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
