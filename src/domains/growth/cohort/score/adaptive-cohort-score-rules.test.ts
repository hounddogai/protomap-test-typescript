import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveCohortScoreClicksRangeRule,
  AdaptiveCohortScoreRequiredAudienceIdRule,
  AdaptiveCohortScoreRequiredCodeRule,
  AdaptiveCohortScoreUtmSourceLengthRule,
  defaultAdaptiveCohortScoreValidator,
} from "./adaptive-cohort-score-rules.js";
import { newAdaptiveCohortScore } from "./adaptive-cohort-score.js";

test("AdaptiveCohortScoreValidator reports every problem", () => {
  const validator = defaultAdaptiveCohortScoreValidator();
  const item = newAdaptiveCohortScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveCohortScoreRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new AdaptiveCohortScoreRequiredAudienceIdRule("adaptive cohort score needs an entry");
  const item = newAdaptiveCohortScore("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveCohortScoreClicksRangeRule flags values above clicks", () => {
  const rule = new AdaptiveCohortScoreClicksRangeRule(64, 86400);
  const item = newAdaptiveCohortScore("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveCohortScoreRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveCohortScoreRequiredCodeRule("adaptive cohort score needs this field");
  const item = newAdaptiveCohortScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveCohortScoreUtmSourceLengthRule flags a long utm source", () => {
  const rule = new AdaptiveCohortScoreUtmSourceLengthRule(32);
  const item = newAdaptiveCohortScore("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
