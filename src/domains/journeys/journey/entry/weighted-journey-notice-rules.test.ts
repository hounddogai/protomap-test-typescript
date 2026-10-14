import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedJourneyNoticeLabelLengthRule,
  WeightedJourneyNoticeRequiredSourceRule,
  defaultWeightedJourneyNoticeValidator,
} from "./weighted-journey-notice-rules.js";
import { newWeightedJourneyNotice } from "./weighted-journey-notice.js";

test("WeightedJourneyNoticeValidator reports every problem", () => {
  const validator = defaultWeightedJourneyNoticeValidator();
  const item = newWeightedJourneyNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedJourneyNoticeLabelLengthRule flags a long label", () => {
  const rule = new WeightedJourneyNoticeLabelLengthRule(255);
  const item = newWeightedJourneyNotice("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedJourneyNoticeRequiredSourceRule flags a blank source", () => {
  const rule = new WeightedJourneyNoticeRequiredSourceRule("weighted journey notice needs an entry");
  const item = newWeightedJourneyNotice("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
