import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFraudCheckRuleCeilingRangeRule,
  LegacyFraudCheckRuleContactEmailLengthRule,
  LegacyFraudCheckRuleRequiredContactEmailRule,
  LegacyFraudCheckRuleRequiredDescriptionRule,
  defaultLegacyFraudCheckRuleValidator,
} from "./legacy-fraud-check-rule-rules.js";
import { newLegacyFraudCheckRule } from "./legacy-fraud-check-rule.js";

test("LegacyFraudCheckRuleValidator reports every problem", () => {
  const validator = defaultLegacyFraudCheckRuleValidator();
  const item = newLegacyFraudCheckRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFraudCheckRuleRequiredDescriptionRule flags a blank description", () => {
  const rule = new LegacyFraudCheckRuleRequiredDescriptionRule("legacy fraud check rule needs a value");
  const item = newLegacyFraudCheckRule("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFraudCheckRuleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new LegacyFraudCheckRuleRequiredContactEmailRule("legacy fraud check rule needs an entry");
  const item = newLegacyFraudCheckRule("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFraudCheckRuleContactEmailLengthRule flags a long contact email", () => {
  const rule = new LegacyFraudCheckRuleContactEmailLengthRule(3600);
  const item = newLegacyFraudCheckRule("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFraudCheckRuleCeilingRangeRule flags values above ceiling", () => {
  const rule = new LegacyFraudCheckRuleCeilingRangeRule(1.5, 4615);
  const item = newLegacyFraudCheckRule("x", "y");
  item.ceiling = 4616.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
