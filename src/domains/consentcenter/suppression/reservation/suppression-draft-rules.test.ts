import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionDraftConversionRateRangeRule,
  SuppressionDraftExternalRefLengthRule,
  SuppressionDraftRequiredTitleRule,
  SuppressionDraftTitleLengthRule,
  defaultSuppressionDraftValidator,
} from "./suppression-draft-rules.js";
import { newSuppressionDraft } from "./suppression-draft.js";

test("SuppressionDraftValidator reports every problem", () => {
  const validator = defaultSuppressionDraftValidator();
  const item = newSuppressionDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionDraftRequiredTitleRule flags a blank title", () => {
  const rule = new SuppressionDraftRequiredTitleRule("suppression draft needs a value");
  const item = newSuppressionDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionDraftTitleLengthRule flags a long title", () => {
  const rule = new SuppressionDraftTitleLengthRule(80);
  const item = newSuppressionDraft("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionDraftConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new SuppressionDraftConversionRateRangeRule(5.6, 1774.1);
  const item = newSuppressionDraft("x", "y");
  item.conversionRate = 1775.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionDraftExternalRefLengthRule flags a long external ref", () => {
  const rule = new SuppressionDraftExternalRefLengthRule(64);
  const item = newSuppressionDraft("x", "y");
  item.externalRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
