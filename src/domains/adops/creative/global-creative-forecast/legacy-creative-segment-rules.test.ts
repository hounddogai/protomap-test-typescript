import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCreativeSegmentBudgetRangeRule,
  LegacyCreativeSegmentRequiredCategoryRule,
  LegacyCreativeSegmentScoreRangeRule,
  LegacyCreativeSegmentTitleLengthRule,
  defaultLegacyCreativeSegmentValidator,
} from "./legacy-creative-segment-rules.js";
import { newLegacyCreativeSegment } from "./legacy-creative-segment.js";

test("LegacyCreativeSegmentValidator reports every problem", () => {
  const validator = defaultLegacyCreativeSegmentValidator();
  const item = newLegacyCreativeSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCreativeSegmentTitleLengthRule flags a long title", () => {
  const rule = new LegacyCreativeSegmentTitleLengthRule(120);
  const item = newLegacyCreativeSegment("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCreativeSegmentScoreRangeRule flags values above score", () => {
  const rule = new LegacyCreativeSegmentScoreRangeRule(1.9, 537.5);
  const item = newLegacyCreativeSegment("x", "y");
  item.score = 539;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyCreativeSegmentBudgetRangeRule flags values above budget", () => {
  const rule = new LegacyCreativeSegmentBudgetRangeRule(1.7, 3523.6);
  const item = newLegacyCreativeSegment("x", "y");
  item.budget = 3525.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyCreativeSegmentRequiredCategoryRule flags a blank category", () => {
  const rule = new LegacyCreativeSegmentRequiredCategoryRule("legacy creative segment needs a value");
  const item = newLegacyCreativeSegment("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
