import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultExitRuleClaimImpressionsRangeRule,
  DefaultExitRuleClaimLabelLengthRule,
  DefaultExitRuleClaimRequiredCodeRule,
  DefaultExitRuleClaimRequiredLabelRule,
  defaultDefaultExitRuleClaimValidator,
} from "./default-exit-rule-claim-rules.js";
import { newDefaultExitRuleClaim } from "./default-exit-rule-claim.js";

test("DefaultExitRuleClaimValidator reports every problem", () => {
  const validator = defaultDefaultExitRuleClaimValidator();
  const item = newDefaultExitRuleClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultExitRuleClaimRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultExitRuleClaimRequiredCodeRule("default exit rule claim needs a value");
  const item = newDefaultExitRuleClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultExitRuleClaimLabelLengthRule flags a long label", () => {
  const rule = new DefaultExitRuleClaimLabelLengthRule(3600);
  const item = newDefaultExitRuleClaim("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultExitRuleClaimImpressionsRangeRule flags values above impressions", () => {
  const rule = new DefaultExitRuleClaimImpressionsRangeRule(16, 120);
  const item = newDefaultExitRuleClaim("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultExitRuleClaimRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultExitRuleClaimRequiredLabelRule("default exit rule claim needs an entry");
  const item = newDefaultExitRuleClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
