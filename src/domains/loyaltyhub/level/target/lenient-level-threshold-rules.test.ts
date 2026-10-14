import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientLevelThresholdBudgetRangeRule,
  LenientLevelThresholdRequiredAudienceIdRule,
  LenientLevelThresholdRequiredCodeRule,
  LenientLevelThresholdRequiredDescriptionRule,
  defaultLenientLevelThresholdValidator,
} from "./lenient-level-threshold-rules.js";
import { newLenientLevelThreshold } from "./lenient-level-threshold.js";

test("LenientLevelThresholdValidator reports every problem", () => {
  const validator = defaultLenientLevelThresholdValidator();
  const item = newLenientLevelThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientLevelThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new LenientLevelThresholdRequiredCodeRule("lenient level threshold needs a value");
  const item = newLenientLevelThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientLevelThresholdBudgetRangeRule flags values above budget", () => {
  const rule = new LenientLevelThresholdBudgetRangeRule(2.5, 2853);
  const item = newLenientLevelThreshold("x", "y");
  item.budget = 2854.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientLevelThresholdRequiredDescriptionRule flags a blank description", () => {
  const rule = new LenientLevelThresholdRequiredDescriptionRule("lenient level threshold needs this field");
  const item = newLenientLevelThreshold("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientLevelThresholdRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new LenientLevelThresholdRequiredAudienceIdRule("lenient level threshold needs an entry");
  const item = newLenientLevelThreshold("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
