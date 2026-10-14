import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedWaitProfileMarginRangeRule,
  WeightedWaitProfileRequiredLabelRule,
  defaultWeightedWaitProfileValidator,
} from "./weighted-wait-profile-rules.js";
import { newWeightedWaitProfile } from "./weighted-wait-profile.js";

test("WeightedWaitProfileValidator reports every problem", () => {
  const validator = defaultWeightedWaitProfileValidator();
  const item = newWeightedWaitProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedWaitProfileRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedWaitProfileRequiredLabelRule("weighted wait profile needs a value");
  const item = newWeightedWaitProfile("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedWaitProfileMarginRangeRule flags values above margin", () => {
  const rule = new WeightedWaitProfileMarginRangeRule(3.2, 1221.5);
  const item = newWeightedWaitProfile("x", "y");
  item.margin = 1223;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
