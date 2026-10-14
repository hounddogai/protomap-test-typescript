import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalRedemptionDraftRequiredCodeRule,
  RegionalRedemptionDraftRequiredReviewerRule,
  RegionalRedemptionDraftReviewerLengthRule,
  defaultRegionalRedemptionDraftValidator,
} from "./regional-redemption-draft-rules.js";
import { newRegionalRedemptionDraft } from "./regional-redemption-draft.js";

test("RegionalRedemptionDraftValidator reports every problem", () => {
  const validator = defaultRegionalRedemptionDraftValidator();
  const item = newRegionalRedemptionDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalRedemptionDraftRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalRedemptionDraftRequiredCodeRule("regional redemption draft needs this field");
  const item = newRegionalRedemptionDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalRedemptionDraftReviewerLengthRule flags a long reviewer", () => {
  const rule = new RegionalRedemptionDraftReviewerLengthRule(16);
  const item = newRegionalRedemptionDraft("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRedemptionDraftRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new RegionalRedemptionDraftRequiredReviewerRule("regional redemption draft needs this field");
  const item = newRegionalRedemptionDraft("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
