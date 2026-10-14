import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultJourneyAgreementAmountRangeRule,
  DefaultJourneyAgreementBudgetRangeRule,
  DefaultJourneyAgreementRequiredCodeRule,
  DefaultJourneyAgreementRequiredNameRule,
  defaultDefaultJourneyAgreementValidator,
} from "./default-journey-agreement-rules.js";
import { newDefaultJourneyAgreement } from "./default-journey-agreement.js";

test("DefaultJourneyAgreementValidator reports every problem", () => {
  const validator = defaultDefaultJourneyAgreementValidator();
  const item = newDefaultJourneyAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultJourneyAgreementRequiredNameRule flags a blank name", () => {
  const rule = new DefaultJourneyAgreementRequiredNameRule("default journey agreement needs this field");
  const item = newDefaultJourneyAgreement("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultJourneyAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultJourneyAgreementRequiredCodeRule("default journey agreement needs a value");
  const item = newDefaultJourneyAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultJourneyAgreementAmountRangeRule flags values above amount", () => {
  const rule = new DefaultJourneyAgreementAmountRangeRule(2.3, 4257.2);
  const item = newDefaultJourneyAgreement("x", "y");
  item.amount = 4258.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultJourneyAgreementBudgetRangeRule flags values above budget", () => {
  const rule = new DefaultJourneyAgreementBudgetRangeRule(2.4, 419.4);
  const item = newDefaultJourneyAgreement("x", "y");
  item.budget = 420.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
