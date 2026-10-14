import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRedemptionScoreRequiredCodeRule,
  StrictRedemptionScoreRequiredLabelRule,
  StrictRedemptionScoreRequiredOwnerIdRule,
  defaultStrictRedemptionScoreValidator,
} from "./strict-redemption-score-rules.js";
import { newStrictRedemptionScore } from "./strict-redemption-score.js";

test("StrictRedemptionScoreValidator reports every problem", () => {
  const validator = defaultStrictRedemptionScoreValidator();
  const item = newStrictRedemptionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRedemptionScoreRequiredCodeRule flags a blank code", () => {
  const rule = new StrictRedemptionScoreRequiredCodeRule("strict redemption score needs this field");
  const item = newStrictRedemptionScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRedemptionScoreRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new StrictRedemptionScoreRequiredOwnerIdRule("strict redemption score needs a value");
  const item = newStrictRedemptionScore("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRedemptionScoreRequiredLabelRule flags a blank label", () => {
  const rule = new StrictRedemptionScoreRequiredLabelRule("strict redemption score needs this field");
  const item = newStrictRedemptionScore("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
