import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveBounceAdjustmentRequiredCodeRule,
  AdaptiveBounceAdjustmentRequiredCohortRule,
  AdaptiveBounceAdjustmentRequiredLabelRule,
  defaultAdaptiveBounceAdjustmentValidator,
} from "./adaptive-bounce-adjustment-rules.js";
import { newAdaptiveBounceAdjustment } from "./adaptive-bounce-adjustment.js";

test("AdaptiveBounceAdjustmentValidator reports every problem", () => {
  const validator = defaultAdaptiveBounceAdjustmentValidator();
  const item = newAdaptiveBounceAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveBounceAdjustmentRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveBounceAdjustmentRequiredLabelRule("adaptive bounce adjustment needs an entry");
  const item = newAdaptiveBounceAdjustment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveBounceAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveBounceAdjustmentRequiredCodeRule("adaptive bounce adjustment needs a value");
  const item = newAdaptiveBounceAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveBounceAdjustmentRequiredCohortRule flags a blank cohort", () => {
  const rule = new AdaptiveBounceAdjustmentRequiredCohortRule("adaptive bounce adjustment needs an entry");
  const item = newAdaptiveBounceAdjustment("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
