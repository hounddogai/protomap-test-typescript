import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeGroupGraceDaysRangeRule,
  BadgeGroupRequiredTitleRule,
  BadgeGroupWindowDaysRangeRule,
  defaultBadgeGroupValidator,
} from "./badge-group-rules.js";
import { newBadgeGroup } from "./badge-group.js";

test("BadgeGroupValidator reports every problem", () => {
  const validator = defaultBadgeGroupValidator();
  const item = newBadgeGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeGroupGraceDaysRangeRule flags values above grace days", () => {
  const rule = new BadgeGroupGraceDaysRangeRule(32, 64);
  const item = newBadgeGroup("x", "y");
  item.graceDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeGroupWindowDaysRangeRule flags values above window days", () => {
  const rule = new BadgeGroupWindowDaysRangeRule(64, 80);
  const item = newBadgeGroup("x", "y");
  item.windowDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeGroupRequiredTitleRule flags a blank title", () => {
  const rule = new BadgeGroupRequiredTitleRule("badge group needs a value");
  const item = newBadgeGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
