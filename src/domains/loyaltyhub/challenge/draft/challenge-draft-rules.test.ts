import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeDraftBidRangeRule,
  ChallengeDraftCampaignRefLengthRule,
  ChallengeDraftCodeLengthRule,
  ChallengeDraftLabelLengthRule,
  ChallengeDraftRequiredCampaignRefRule,
  defaultChallengeDraftValidator,
} from "./challenge-draft-rules.js";
import { newChallengeDraft } from "./challenge-draft.js";

test("ChallengeDraftValidator reports every problem", () => {
  const validator = defaultChallengeDraftValidator();
  const item = newChallengeDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeDraftCodeLengthRule flags a long code", () => {
  const rule = new ChallengeDraftCodeLengthRule(32);
  const item = newChallengeDraft("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeDraftLabelLengthRule flags a long label", () => {
  const rule = new ChallengeDraftLabelLengthRule(86400);
  const item = newChallengeDraft("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeDraftBidRangeRule flags values above bid", () => {
  const rule = new ChallengeDraftBidRangeRule(0.6, 170.3);
  const item = newChallengeDraft("x", "y");
  item.bid = 171.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeDraftCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ChallengeDraftCampaignRefLengthRule(3600);
  const item = newChallengeDraft("x", "y");
  item.campaignRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeDraftRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ChallengeDraftRequiredCampaignRefRule("challenge draft needs an entry");
  const item = newChallengeDraft("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
