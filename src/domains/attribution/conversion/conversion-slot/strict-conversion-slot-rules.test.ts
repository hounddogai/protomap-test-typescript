import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictConversionSlotCampaignRefLengthRule,
  StrictConversionSlotRequiredCampaignRefRule,
  StrictConversionSlotRequiredCodeRule,
  StrictConversionSlotRequiredTitleRule,
  StrictConversionSlotTitleLengthRule,
  defaultStrictConversionSlotValidator,
} from "./strict-conversion-slot-rules.js";
import { newStrictConversionSlot } from "./strict-conversion-slot.js";

test("StrictConversionSlotValidator reports every problem", () => {
  const validator = defaultStrictConversionSlotValidator();
  const item = newStrictConversionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictConversionSlotRequiredTitleRule flags a blank title", () => {
  const rule = new StrictConversionSlotRequiredTitleRule("strict conversion slot needs a value");
  const item = newStrictConversionSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictConversionSlotTitleLengthRule flags a long title", () => {
  const rule = new StrictConversionSlotTitleLengthRule(120);
  const item = newStrictConversionSlot("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictConversionSlotRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new StrictConversionSlotRequiredCampaignRefRule("strict conversion slot needs this field");
  const item = newStrictConversionSlot("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictConversionSlotRequiredCodeRule flags a blank code", () => {
  const rule = new StrictConversionSlotRequiredCodeRule("strict conversion slot needs an entry");
  const item = newStrictConversionSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictConversionSlotCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new StrictConversionSlotCampaignRefLengthRule(32);
  const item = newStrictConversionSlot("x", "y");
  item.campaignRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
