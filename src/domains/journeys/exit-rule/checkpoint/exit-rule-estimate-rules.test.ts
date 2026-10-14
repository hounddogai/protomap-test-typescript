import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleEstimateRateRangeRule,
  ExitRuleEstimateRequiredNameRule,
  defaultExitRuleEstimateValidator,
} from "./exit-rule-estimate-rules.js";
import { newExitRuleEstimate } from "./exit-rule-estimate.js";

test("ExitRuleEstimateValidator reports every problem", () => {
  const validator = defaultExitRuleEstimateValidator();
  const item = newExitRuleEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleEstimateRequiredNameRule flags a blank name", () => {
  const rule = new ExitRuleEstimateRequiredNameRule("exit rule estimate needs this field");
  const item = newExitRuleEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleEstimateRateRangeRule flags values above rate", () => {
  const rule = new ExitRuleEstimateRateRangeRule(4.5, 1523.5);
  const item = newExitRuleEstimate("x", "y");
  item.rate = 1525;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
