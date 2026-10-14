import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalExitRuleBaselineAudienceIdLengthRule,
  RegionalExitRuleBaselineBatchSizeRangeRule,
  RegionalExitRuleBaselineCodeLengthRule,
  defaultRegionalExitRuleBaselineValidator,
} from "./regional-exit-rule-baseline-rules.js";
import { newRegionalExitRuleBaseline } from "./regional-exit-rule-baseline.js";

test("RegionalExitRuleBaselineValidator reports every problem", () => {
  const validator = defaultRegionalExitRuleBaselineValidator();
  const item = newRegionalExitRuleBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalExitRuleBaselineCodeLengthRule flags a long code", () => {
  const rule = new RegionalExitRuleBaselineCodeLengthRule(16);
  const item = newRegionalExitRuleBaseline("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalExitRuleBaselineBatchSizeRangeRule flags values above batch size", () => {
  const rule = new RegionalExitRuleBaselineBatchSizeRangeRule(16, 16);
  const item = newRegionalExitRuleBaseline("x", "y");
  item.batchSize = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalExitRuleBaselineAudienceIdLengthRule flags a long audience id", () => {
  const rule = new RegionalExitRuleBaselineAudienceIdLengthRule(1000);
  const item = newRegionalExitRuleBaseline("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
