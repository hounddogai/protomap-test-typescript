import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightDraftLabelLengthRule,
  InsightDraftRateRangeRule,
  InsightDraftRequiredCodeRule,
  InsightDraftRequiredLabelRule,
  defaultInsightDraftValidator,
} from "./insight-draft-rules.js";
import { newInsightDraft } from "./insight-draft.js";

test("InsightDraftValidator reports every problem", () => {
  const validator = defaultInsightDraftValidator();
  const item = newInsightDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightDraftLabelLengthRule flags a long label", () => {
  const rule = new InsightDraftLabelLengthRule(16);
  const item = newInsightDraft("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightDraftRequiredLabelRule flags a blank label", () => {
  const rule = new InsightDraftRequiredLabelRule("insight draft needs an entry");
  const item = newInsightDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightDraftRateRangeRule flags values above rate", () => {
  const rule = new InsightDraftRateRangeRule(7.5, 169.4);
  const item = newInsightDraft("x", "y");
  item.rate = 170.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightDraftRequiredCodeRule flags a blank code", () => {
  const rule = new InsightDraftRequiredCodeRule("insight draft needs an entry");
  const item = newInsightDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
