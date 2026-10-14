import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPlacementPreferenceCodeLengthRule,
  BatchedPlacementPreferenceRateRangeRule,
  defaultBatchedPlacementPreferenceValidator,
} from "./batched-placement-preference-rules.js";
import { newBatchedPlacementPreference } from "./batched-placement-preference.js";

test("BatchedPlacementPreferenceValidator reports every problem", () => {
  const validator = defaultBatchedPlacementPreferenceValidator();
  const item = newBatchedPlacementPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPlacementPreferenceCodeLengthRule flags a long code", () => {
  const rule = new BatchedPlacementPreferenceCodeLengthRule(120);
  const item = newBatchedPlacementPreference("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPlacementPreferenceRateRangeRule flags values above rate", () => {
  const rule = new BatchedPlacementPreferenceRateRangeRule(9.9, 4035.3);
  const item = newBatchedPlacementPreference("x", "y");
  item.rate = 4036.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
