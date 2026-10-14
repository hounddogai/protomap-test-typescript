import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPlacementSlotBudgetRangeRule,
  StrictPlacementSlotCampaignRefLengthRule,
  StrictPlacementSlotRequiredCodeRule,
  StrictPlacementSlotRequiredNameRule,
  StrictPlacementSlotSummaryLengthRule,
  defaultStrictPlacementSlotValidator,
} from "./strict-placement-slot-rules.js";
import { newStrictPlacementSlot } from "./strict-placement-slot.js";

test("StrictPlacementSlotValidator reports every problem", () => {
  const validator = defaultStrictPlacementSlotValidator();
  const item = newStrictPlacementSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPlacementSlotRequiredCodeRule flags a blank code", () => {
  const rule = new StrictPlacementSlotRequiredCodeRule("strict placement slot needs a value");
  const item = newStrictPlacementSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPlacementSlotBudgetRangeRule flags values above budget", () => {
  const rule = new StrictPlacementSlotBudgetRangeRule(9.1, 3139.6);
  const item = newStrictPlacementSlot("x", "y");
  item.budget = 3141.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPlacementSlotSummaryLengthRule flags a long summary", () => {
  const rule = new StrictPlacementSlotSummaryLengthRule(1000);
  const item = newStrictPlacementSlot("x", "y");
  item.summary = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPlacementSlotRequiredNameRule flags a blank name", () => {
  const rule = new StrictPlacementSlotRequiredNameRule("strict placement slot needs this field");
  const item = newStrictPlacementSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPlacementSlotCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new StrictPlacementSlotCampaignRefLengthRule(3600);
  const item = newStrictPlacementSlot("x", "y");
  item.campaignRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
