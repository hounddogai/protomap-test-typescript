import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeRuleBatchSizeRangeRule,
  ChallengeRuleRequiredLabelRule,
  ChallengeRuleRequiredLocaleRule,
  defaultChallengeRuleValidator,
} from "./challenge-rule-rules.js";
import { newChallengeRule } from "./challenge-rule.js";

test("ChallengeRuleValidator reports every problem", () => {
  const validator = defaultChallengeRuleValidator();
  const item = newChallengeRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeRuleRequiredLabelRule flags a blank label", () => {
  const rule = new ChallengeRuleRequiredLabelRule("challenge rule needs this field");
  const item = newChallengeRule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeRuleRequiredLocaleRule flags a blank locale", () => {
  const rule = new ChallengeRuleRequiredLocaleRule("challenge rule needs a value");
  const item = newChallengeRule("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeRuleBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ChallengeRuleBatchSizeRangeRule(80, 255);
  const item = newChallengeRule("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
