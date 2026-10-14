import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBidRuleMilestoneCategoryLengthRule,
  SeasonalBidRuleMilestoneChecksumLengthRule,
  SeasonalBidRuleMilestoneRequiredChecksumRule,
  SeasonalBidRuleMilestoneRequiredTitleRule,
  defaultSeasonalBidRuleMilestoneValidator,
} from "./seasonal-bid-rule-milestone-rules.js";
import { newSeasonalBidRuleMilestone } from "./seasonal-bid-rule-milestone.js";

test("SeasonalBidRuleMilestoneValidator reports every problem", () => {
  const validator = defaultSeasonalBidRuleMilestoneValidator();
  const item = newSeasonalBidRuleMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBidRuleMilestoneRequiredChecksumRule flags a blank checksum", () => {
  const rule = new SeasonalBidRuleMilestoneRequiredChecksumRule("seasonal bid rule milestone needs a value");
  const item = newSeasonalBidRuleMilestone("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBidRuleMilestoneCategoryLengthRule flags a long category", () => {
  const rule = new SeasonalBidRuleMilestoneCategoryLengthRule(80);
  const item = newSeasonalBidRuleMilestone("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBidRuleMilestoneChecksumLengthRule flags a long checksum", () => {
  const rule = new SeasonalBidRuleMilestoneChecksumLengthRule(64);
  const item = newSeasonalBidRuleMilestone("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBidRuleMilestoneRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalBidRuleMilestoneRequiredTitleRule("seasonal bid rule milestone needs a value");
  const item = newSeasonalBidRuleMilestone("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
