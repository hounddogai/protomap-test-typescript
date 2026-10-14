import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveRewardRuleSummaryRequiredNameRule,
  AdaptiveRewardRuleSummaryTimezoneLengthRule,
  defaultAdaptiveRewardRuleSummaryValidator,
} from "./adaptive-reward-rule-summary-rules.js";
import { newAdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

test("AdaptiveRewardRuleSummaryValidator reports every problem", () => {
  const validator = defaultAdaptiveRewardRuleSummaryValidator();
  const item = newAdaptiveRewardRuleSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveRewardRuleSummaryRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveRewardRuleSummaryRequiredNameRule("adaptive reward rule summary needs a value");
  const item = newAdaptiveRewardRuleSummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveRewardRuleSummaryTimezoneLengthRule flags a long timezone", () => {
  const rule = new AdaptiveRewardRuleSummaryTimezoneLengthRule(64);
  const item = newAdaptiveRewardRuleSummary("x", "y");
  item.timezone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
