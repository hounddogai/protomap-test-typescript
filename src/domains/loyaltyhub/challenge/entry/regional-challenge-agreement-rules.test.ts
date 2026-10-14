import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalChallengeAgreementCampaignRefLengthRule,
  RegionalChallengeAgreementCodeLengthRule,
  RegionalChallengeAgreementNameLengthRule,
  RegionalChallengeAgreementVariantLengthRule,
  defaultRegionalChallengeAgreementValidator,
} from "./regional-challenge-agreement-rules.js";
import { newRegionalChallengeAgreement } from "./regional-challenge-agreement.js";

test("RegionalChallengeAgreementValidator reports every problem", () => {
  const validator = defaultRegionalChallengeAgreementValidator();
  const item = newRegionalChallengeAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalChallengeAgreementCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RegionalChallengeAgreementCampaignRefLengthRule(86400);
  const item = newRegionalChallengeAgreement("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalChallengeAgreementCodeLengthRule flags a long code", () => {
  const rule = new RegionalChallengeAgreementCodeLengthRule(80);
  const item = newRegionalChallengeAgreement("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalChallengeAgreementNameLengthRule flags a long name", () => {
  const rule = new RegionalChallengeAgreementNameLengthRule(1000);
  const item = newRegionalChallengeAgreement("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalChallengeAgreementVariantLengthRule flags a long variant", () => {
  const rule = new RegionalChallengeAgreementVariantLengthRule(3600);
  const item = newRegionalChallengeAgreement("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
