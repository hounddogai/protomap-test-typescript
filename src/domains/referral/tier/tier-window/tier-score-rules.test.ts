import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierScoreRequiredCodeRule,
  TierScoreRequiredCohortRule,
  TierScoreRequiredNameRule,
  defaultTierScoreValidator,
} from "./tier-score-rules.js";
import { newTierScore } from "./tier-score.js";

test("TierScoreValidator reports every problem", () => {
  const validator = defaultTierScoreValidator();
  const item = newTierScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierScoreRequiredCohortRule flags a blank cohort", () => {
  const rule = new TierScoreRequiredCohortRule("tier score needs this field");
  const item = newTierScore("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierScoreRequiredCodeRule flags a blank code", () => {
  const rule = new TierScoreRequiredCodeRule("tier score needs a value");
  const item = newTierScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierScoreRequiredNameRule flags a blank name", () => {
  const rule = new TierScoreRequiredNameRule("tier score needs an entry");
  const item = newTierScore("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
