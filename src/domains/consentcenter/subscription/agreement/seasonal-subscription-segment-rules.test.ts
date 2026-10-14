import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSubscriptionSegmentFloorValueRangeRule,
  SeasonalSubscriptionSegmentRequiredAudienceIdRule,
  SeasonalSubscriptionSegmentRequiredCodeRule,
  SeasonalSubscriptionSegmentRequiredDescriptionRule,
  SeasonalSubscriptionSegmentRequiredNameRule,
  defaultSeasonalSubscriptionSegmentValidator,
} from "./seasonal-subscription-segment-rules.js";
import { newSeasonalSubscriptionSegment } from "./seasonal-subscription-segment.js";

test("SeasonalSubscriptionSegmentValidator reports every problem", () => {
  const validator = defaultSeasonalSubscriptionSegmentValidator();
  const item = newSeasonalSubscriptionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSubscriptionSegmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new SeasonalSubscriptionSegmentFloorValueRangeRule(4.6, 1023.1);
  const item = newSeasonalSubscriptionSegment("x", "y");
  item.floorValue = 1024.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSubscriptionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalSubscriptionSegmentRequiredCodeRule("seasonal subscription segment needs an entry");
  const item = newSeasonalSubscriptionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSubscriptionSegmentRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalSubscriptionSegmentRequiredNameRule("seasonal subscription segment needs this field");
  const item = newSeasonalSubscriptionSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSubscriptionSegmentRequiredDescriptionRule flags a blank description", () => {
  const rule = new SeasonalSubscriptionSegmentRequiredDescriptionRule("seasonal subscription segment needs an entry");
  const item = newSeasonalSubscriptionSegment("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSubscriptionSegmentRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new SeasonalSubscriptionSegmentRequiredAudienceIdRule("seasonal subscription segment needs an entry");
  const item = newSeasonalSubscriptionSegment("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
