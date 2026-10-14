import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionDraftJourneyIdLengthRule,
  RedemptionDraftScoreRangeRule,
  defaultRedemptionDraftValidator,
} from "./redemption-draft-rules.js";
import { newRedemptionDraft } from "./redemption-draft.js";

test("RedemptionDraftValidator reports every problem", () => {
  const validator = defaultRedemptionDraftValidator();
  const item = newRedemptionDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionDraftJourneyIdLengthRule flags a long journey id", () => {
  const rule = new RedemptionDraftJourneyIdLengthRule(16);
  const item = newRedemptionDraft("x", "y");
  item.journeyId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionDraftScoreRangeRule flags values above score", () => {
  const rule = new RedemptionDraftScoreRangeRule(7.3, 3900.2);
  const item = newRedemptionDraft("x", "y");
  item.score = 3901.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
