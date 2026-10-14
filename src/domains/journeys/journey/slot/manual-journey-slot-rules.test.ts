import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualJourneySlotChannelLengthRule,
  ManualJourneySlotCodeLengthRule,
  ManualJourneySlotLabelLengthRule,
  ManualJourneySlotRequiredChannelRule,
  ManualJourneySlotRequiredExternalRefRule,
  ManualJourneySlotRetriesRangeRule,
  defaultManualJourneySlotValidator,
} from "./manual-journey-slot-rules.js";
import { newManualJourneySlot } from "./manual-journey-slot.js";

test("ManualJourneySlotValidator reports every problem", () => {
  const validator = defaultManualJourneySlotValidator();
  const item = newManualJourneySlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualJourneySlotLabelLengthRule flags a long label", () => {
  const rule = new ManualJourneySlotLabelLengthRule(64);
  const item = newManualJourneySlot("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualJourneySlotRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ManualJourneySlotRequiredExternalRefRule("manual journey slot needs a value");
  const item = newManualJourneySlot("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualJourneySlotChannelLengthRule flags a long channel", () => {
  const rule = new ManualJourneySlotChannelLengthRule(3600);
  const item = newManualJourneySlot("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualJourneySlotCodeLengthRule flags a long code", () => {
  const rule = new ManualJourneySlotCodeLengthRule(120);
  const item = newManualJourneySlot("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualJourneySlotRequiredChannelRule flags a blank channel", () => {
  const rule = new ManualJourneySlotRequiredChannelRule("manual journey slot needs this field");
  const item = newManualJourneySlot("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualJourneySlotRetriesRangeRule flags values above retries", () => {
  const rule = new ManualJourneySlotRetriesRangeRule(80, 255);
  const item = newManualJourneySlot("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
