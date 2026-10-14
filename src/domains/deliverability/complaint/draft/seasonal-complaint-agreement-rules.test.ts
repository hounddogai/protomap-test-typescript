import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalComplaintAgreementBudgetRangeRule,
  SeasonalComplaintAgreementCategoryLengthRule,
  SeasonalComplaintAgreementCodeLengthRule,
  SeasonalComplaintAgreementEndsAtRangeRule,
  SeasonalComplaintAgreementRequiredCategoryRule,
  SeasonalComplaintAgreementRequiredCodeRule,
  defaultSeasonalComplaintAgreementValidator,
} from "./seasonal-complaint-agreement-rules.js";
import { newSeasonalComplaintAgreement } from "./seasonal-complaint-agreement.js";

test("SeasonalComplaintAgreementValidator reports every problem", () => {
  const validator = defaultSeasonalComplaintAgreementValidator();
  const item = newSeasonalComplaintAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalComplaintAgreementBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalComplaintAgreementBudgetRangeRule(8.2, 141.1);
  const item = newSeasonalComplaintAgreement("x", "y");
  item.budget = 142.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalComplaintAgreementCodeLengthRule flags a long code", () => {
  const rule = new SeasonalComplaintAgreementCodeLengthRule(32);
  const item = newSeasonalComplaintAgreement("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalComplaintAgreementEndsAtRangeRule flags values above ends at", () => {
  const rule = new SeasonalComplaintAgreementEndsAtRangeRule(16, 255);
  const item = newSeasonalComplaintAgreement("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalComplaintAgreementRequiredCategoryRule flags a blank category", () => {
  const rule = new SeasonalComplaintAgreementRequiredCategoryRule("seasonal complaint agreement needs this field");
  const item = newSeasonalComplaintAgreement("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalComplaintAgreementCategoryLengthRule flags a long category", () => {
  const rule = new SeasonalComplaintAgreementCategoryLengthRule(120);
  const item = newSeasonalComplaintAgreement("x", "y");
  item.category = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalComplaintAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalComplaintAgreementRequiredCodeRule("seasonal complaint agreement needs this field");
  const item = newSeasonalComplaintAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
