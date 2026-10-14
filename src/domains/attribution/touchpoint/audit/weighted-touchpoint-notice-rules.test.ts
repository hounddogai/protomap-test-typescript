import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedTouchpointNoticeChannelLengthRule,
  WeightedTouchpointNoticeCodeLengthRule,
  WeightedTouchpointNoticeFloorValueRangeRule,
  WeightedTouchpointNoticeNameLengthRule,
  WeightedTouchpointNoticeRequiredCodeRule,
  WeightedTouchpointNoticeRequiredNameRule,
  defaultWeightedTouchpointNoticeValidator,
} from "./weighted-touchpoint-notice-rules.js";
import { newWeightedTouchpointNotice } from "./weighted-touchpoint-notice.js";

test("WeightedTouchpointNoticeValidator reports every problem", () => {
  const validator = defaultWeightedTouchpointNoticeValidator();
  const item = newWeightedTouchpointNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedTouchpointNoticeChannelLengthRule flags a long channel", () => {
  const rule = new WeightedTouchpointNoticeChannelLengthRule(16);
  const item = newWeightedTouchpointNotice("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedTouchpointNoticeRequiredNameRule flags a blank name", () => {
  const rule = new WeightedTouchpointNoticeRequiredNameRule("weighted touchpoint notice needs an entry");
  const item = newWeightedTouchpointNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedTouchpointNoticeCodeLengthRule flags a long code", () => {
  const rule = new WeightedTouchpointNoticeCodeLengthRule(80);
  const item = newWeightedTouchpointNotice("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedTouchpointNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedTouchpointNoticeRequiredCodeRule("weighted touchpoint notice needs an entry");
  const item = newWeightedTouchpointNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedTouchpointNoticeNameLengthRule flags a long name", () => {
  const rule = new WeightedTouchpointNoticeNameLengthRule(86400);
  const item = newWeightedTouchpointNotice("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedTouchpointNoticeFloorValueRangeRule flags values above floor value", () => {
  const rule = new WeightedTouchpointNoticeFloorValueRangeRule(7.8, 4976.7);
  const item = newWeightedTouchpointNotice("x", "y");
  item.floorValue = 4978.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
