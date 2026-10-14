import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCreativeNoticeFloorValueRangeRule,
  SeasonalCreativeNoticePriorityRangeRule,
  SeasonalCreativeNoticeRequiredNameRule,
  defaultSeasonalCreativeNoticeValidator,
} from "./seasonal-creative-notice-rules.js";
import { newSeasonalCreativeNotice } from "./seasonal-creative-notice.js";

test("SeasonalCreativeNoticeValidator reports every problem", () => {
  const validator = defaultSeasonalCreativeNoticeValidator();
  const item = newSeasonalCreativeNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCreativeNoticeFloorValueRangeRule flags values above floor value", () => {
  const rule = new SeasonalCreativeNoticeFloorValueRangeRule(8.5, 4340.9);
  const item = newSeasonalCreativeNotice("x", "y");
  item.floorValue = 4342.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalCreativeNoticePriorityRangeRule flags values above priority", () => {
  const rule = new SeasonalCreativeNoticePriorityRangeRule(80, 255);
  const item = newSeasonalCreativeNotice("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalCreativeNoticeRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalCreativeNoticeRequiredNameRule("seasonal creative notice needs this field");
  const item = newSeasonalCreativeNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
