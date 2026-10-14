import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyActivationExceptionNameLengthRule,
  LegacyActivationExceptionQuantityRangeRule,
  LegacyActivationExceptionRequiredCampaignRefRule,
  LegacyActivationExceptionRequiredCodeRule,
  LegacyActivationExceptionRequiredNameRule,
  defaultLegacyActivationExceptionValidator,
} from "./legacy-activation-exception-rules.js";
import { newLegacyActivationException } from "./legacy-activation-exception.js";

test("LegacyActivationExceptionValidator reports every problem", () => {
  const validator = defaultLegacyActivationExceptionValidator();
  const item = newLegacyActivationException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyActivationExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyActivationExceptionRequiredCodeRule("legacy activation exception needs a value");
  const item = newLegacyActivationException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyActivationExceptionRequiredNameRule flags a blank name", () => {
  const rule = new LegacyActivationExceptionRequiredNameRule("legacy activation exception needs this field");
  const item = newLegacyActivationException("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyActivationExceptionQuantityRangeRule flags values above quantity", () => {
  const rule = new LegacyActivationExceptionQuantityRangeRule(80, 80);
  const item = newLegacyActivationException("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyActivationExceptionNameLengthRule flags a long name", () => {
  const rule = new LegacyActivationExceptionNameLengthRule(120);
  const item = newLegacyActivationException("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyActivationExceptionRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LegacyActivationExceptionRequiredCampaignRefRule("legacy activation exception needs an entry");
  const item = newLegacyActivationException("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
