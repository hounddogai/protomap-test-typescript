import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBounceMilestoneNameLengthRule,
  TieredBounceMilestoneRatioRangeRule,
  TieredBounceMilestoneRequiredNameRule,
  TieredBounceMilestoneRequiredTitleRule,
  TieredBounceMilestoneTitleLengthRule,
  defaultTieredBounceMilestoneValidator,
} from "./tiered-bounce-milestone-rules.js";
import { newTieredBounceMilestone } from "./tiered-bounce-milestone.js";

test("TieredBounceMilestoneValidator reports every problem", () => {
  const validator = defaultTieredBounceMilestoneValidator();
  const item = newTieredBounceMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBounceMilestoneRequiredNameRule flags a blank name", () => {
  const rule = new TieredBounceMilestoneRequiredNameRule("tiered bounce milestone needs an entry");
  const item = newTieredBounceMilestone("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBounceMilestoneNameLengthRule flags a long name", () => {
  const rule = new TieredBounceMilestoneNameLengthRule(255);
  const item = newTieredBounceMilestone("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBounceMilestoneRequiredTitleRule flags a blank title", () => {
  const rule = new TieredBounceMilestoneRequiredTitleRule("tiered bounce milestone needs a value");
  const item = newTieredBounceMilestone("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBounceMilestoneRatioRangeRule flags values above ratio", () => {
  const rule = new TieredBounceMilestoneRatioRangeRule(0.7, 3098.8);
  const item = newTieredBounceMilestone("x", "y");
  item.ratio = 3100.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBounceMilestoneTitleLengthRule flags a long title", () => {
  const rule = new TieredBounceMilestoneTitleLengthRule(120);
  const item = newTieredBounceMilestone("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
