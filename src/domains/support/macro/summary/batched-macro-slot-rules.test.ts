import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedMacroSlotCampaignRefLengthRule,
  BatchedMacroSlotNameLengthRule,
  BatchedMacroSlotRequiredCampaignRefRule,
  BatchedMacroSlotRequiredNameRule,
  BatchedMacroSlotRequiredNotesRule,
  defaultBatchedMacroSlotValidator,
} from "./batched-macro-slot-rules.js";
import { newBatchedMacroSlot } from "./batched-macro-slot.js";

test("BatchedMacroSlotValidator reports every problem", () => {
  const validator = defaultBatchedMacroSlotValidator();
  const item = newBatchedMacroSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedMacroSlotRequiredNotesRule flags a blank notes", () => {
  const rule = new BatchedMacroSlotRequiredNotesRule("batched macro slot needs an entry");
  const item = newBatchedMacroSlot("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedMacroSlotCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new BatchedMacroSlotCampaignRefLengthRule(86400);
  const item = newBatchedMacroSlot("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedMacroSlotRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new BatchedMacroSlotRequiredCampaignRefRule("batched macro slot needs an entry");
  const item = newBatchedMacroSlot("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedMacroSlotNameLengthRule flags a long name", () => {
  const rule = new BatchedMacroSlotNameLengthRule(255);
  const item = newBatchedMacroSlot("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedMacroSlotRequiredNameRule flags a blank name", () => {
  const rule = new BatchedMacroSlotRequiredNameRule("batched macro slot needs a value");
  const item = newBatchedMacroSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
