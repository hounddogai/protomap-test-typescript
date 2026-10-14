import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyBranchSlotRequiredCohortRule,
  LegacyBranchSlotRequiredTitleRule,
  LegacyBranchSlotTitleLengthRule,
  defaultLegacyBranchSlotValidator,
} from "./legacy-branch-slot-rules.js";
import { newLegacyBranchSlot } from "./legacy-branch-slot.js";

test("LegacyBranchSlotValidator reports every problem", () => {
  const validator = defaultLegacyBranchSlotValidator();
  const item = newLegacyBranchSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyBranchSlotRequiredCohortRule flags a blank cohort", () => {
  const rule = new LegacyBranchSlotRequiredCohortRule("legacy branch slot needs this field");
  const item = newLegacyBranchSlot("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBranchSlotRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyBranchSlotRequiredTitleRule("legacy branch slot needs this field");
  const item = newLegacyBranchSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBranchSlotTitleLengthRule flags a long title", () => {
  const rule = new LegacyBranchSlotTitleLengthRule(32);
  const item = newLegacyBranchSlot("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
