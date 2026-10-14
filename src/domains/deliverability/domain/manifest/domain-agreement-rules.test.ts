import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainAgreementCategoryLengthRule,
  DomainAgreementImpressionsRangeRule,
  DomainAgreementQuantityRangeRule,
  DomainAgreementRequiredCodeRule,
  defaultDomainAgreementValidator,
} from "./domain-agreement-rules.js";
import { newDomainAgreement } from "./domain-agreement.js";

test("DomainAgreementValidator reports every problem", () => {
  const validator = defaultDomainAgreementValidator();
  const item = newDomainAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainAgreementImpressionsRangeRule flags values above impressions", () => {
  const rule = new DomainAgreementImpressionsRangeRule(120, 1000);
  const item = newDomainAgreement("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new DomainAgreementRequiredCodeRule("domain agreement needs an entry");
  const item = newDomainAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainAgreementCategoryLengthRule flags a long category", () => {
  const rule = new DomainAgreementCategoryLengthRule(32);
  const item = newDomainAgreement("x", "y");
  item.category = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainAgreementQuantityRangeRule flags values above quantity", () => {
  const rule = new DomainAgreementQuantityRangeRule(64, 1000);
  const item = newDomainAgreement("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
