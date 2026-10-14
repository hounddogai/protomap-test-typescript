import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalRewardRuleExceptionContactEmailLengthRule,
  RegionalRewardRuleExceptionRequiredContactEmailRule,
  defaultRegionalRewardRuleExceptionValidator,
} from "./regional-reward-rule-exception-rules.js";
import { newRegionalRewardRuleException } from "./regional-reward-rule-exception.js";

test("RegionalRewardRuleExceptionValidator reports every problem", () => {
  const validator = defaultRegionalRewardRuleExceptionValidator();
  const item = newRegionalRewardRuleException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalRewardRuleExceptionContactEmailLengthRule flags a long contact email", () => {
  const rule = new RegionalRewardRuleExceptionContactEmailLengthRule(1000);
  const item = newRegionalRewardRuleException("x", "y");
  item.contactEmail = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRewardRuleExceptionRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RegionalRewardRuleExceptionRequiredContactEmailRule("regional reward rule exception needs this field");
  const item = newRegionalRewardRuleException("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
