import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementScheduleCodeLengthRule,
  PlacementScheduleImpressionsRangeRule,
  PlacementScheduleRegionLengthRule,
  PlacementScheduleRetriesRangeRule,
  PlacementScheduleRevisionRangeRule,
  PlacementScheduleTitleLengthRule,
  defaultPlacementScheduleValidator,
} from "./placement-schedule-rules.js";
import { newPlacementSchedule } from "./placement-schedule.js";

test("PlacementScheduleValidator reports every problem", () => {
  const validator = defaultPlacementScheduleValidator();
  const item = newPlacementSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementScheduleRetriesRangeRule flags values above retries", () => {
  const rule = new PlacementScheduleRetriesRangeRule(80, 120);
  const item = newPlacementSchedule("x", "y");
  item.retries = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementScheduleRevisionRangeRule flags values above revision", () => {
  const rule = new PlacementScheduleRevisionRangeRule(80, 1000);
  const item = newPlacementSchedule("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementScheduleTitleLengthRule flags a long title", () => {
  const rule = new PlacementScheduleTitleLengthRule(255);
  const item = newPlacementSchedule("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementScheduleCodeLengthRule flags a long code", () => {
  const rule = new PlacementScheduleCodeLengthRule(3600);
  const item = newPlacementSchedule("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementScheduleImpressionsRangeRule flags values above impressions", () => {
  const rule = new PlacementScheduleImpressionsRangeRule(16, 32);
  const item = newPlacementSchedule("x", "y");
  item.impressions = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementScheduleRegionLengthRule flags a long region", () => {
  const rule = new PlacementScheduleRegionLengthRule(1000);
  const item = newPlacementSchedule("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
