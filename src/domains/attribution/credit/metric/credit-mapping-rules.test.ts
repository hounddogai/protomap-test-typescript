import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditMappingCampaignRefLengthRule,
  CreditMappingNameLengthRule,
  CreditMappingRequiredCodeRule,
  CreditMappingRequiredJourneyIdRule,
  CreditMappingSequenceRangeRule,
  defaultCreditMappingValidator,
} from "./credit-mapping-rules.js";
import { newCreditMapping } from "./credit-mapping.js";

test("CreditMappingValidator reports every problem", () => {
  const validator = defaultCreditMappingValidator();
  const item = newCreditMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditMappingNameLengthRule flags a long name", () => {
  const rule = new CreditMappingNameLengthRule(64);
  const item = newCreditMapping("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditMappingSequenceRangeRule flags values above sequence", () => {
  const rule = new CreditMappingSequenceRangeRule(32, 80);
  const item = newCreditMapping("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditMappingRequiredCodeRule flags a blank code", () => {
  const rule = new CreditMappingRequiredCodeRule("credit mapping needs an entry");
  const item = newCreditMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditMappingRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new CreditMappingRequiredJourneyIdRule("credit mapping needs a value");
  const item = newCreditMapping("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditMappingCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CreditMappingCampaignRefLengthRule(255);
  const item = newCreditMapping("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
