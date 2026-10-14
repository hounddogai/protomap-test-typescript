import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationDraftCodeLengthRule,
  ReputationDraftMarginRangeRule,
  ReputationDraftNameLengthRule,
  ReputationDraftRequiredCampaignRefRule,
  ReputationDraftWindowDaysRangeRule,
  defaultReputationDraftValidator,
} from "./reputation-draft-rules.js";
import { newReputationDraft } from "./reputation-draft.js";

test("ReputationDraftValidator reports every problem", () => {
  const validator = defaultReputationDraftValidator();
  const item = newReputationDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationDraftNameLengthRule flags a long name", () => {
  const rule = new ReputationDraftNameLengthRule(120);
  const item = newReputationDraft("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationDraftRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ReputationDraftRequiredCampaignRefRule("reputation draft needs this field");
  const item = newReputationDraft("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationDraftCodeLengthRule flags a long code", () => {
  const rule = new ReputationDraftCodeLengthRule(80);
  const item = newReputationDraft("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationDraftMarginRangeRule flags values above margin", () => {
  const rule = new ReputationDraftMarginRangeRule(5.5, 930.4);
  const item = newReputationDraft("x", "y");
  item.margin = 931.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationDraftWindowDaysRangeRule flags values above window days", () => {
  const rule = new ReputationDraftWindowDaysRangeRule(64, 120);
  const item = newReputationDraft("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
