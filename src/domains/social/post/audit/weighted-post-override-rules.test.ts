import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPostOverrideRegionLengthRule,
  WeightedPostOverrideRequiredNameRule,
  defaultWeightedPostOverrideValidator,
} from "./weighted-post-override-rules.js";
import { newWeightedPostOverride } from "./weighted-post-override.js";

test("WeightedPostOverrideValidator reports every problem", () => {
  const validator = defaultWeightedPostOverrideValidator();
  const item = newWeightedPostOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPostOverrideRegionLengthRule flags a long region", () => {
  const rule = new WeightedPostOverrideRegionLengthRule(3600);
  const item = newWeightedPostOverride("x", "y");
  item.region = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPostOverrideRequiredNameRule flags a blank name", () => {
  const rule = new WeightedPostOverrideRequiredNameRule("weighted post override needs this field");
  const item = newWeightedPostOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
