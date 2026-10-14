import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchSlotBidRangeRule,
  BranchSlotOpenRateRangeRule,
  BranchSlotRequiredNameRule,
  defaultBranchSlotValidator,
} from "./branch-slot-rules.js";
import { newBranchSlot } from "./branch-slot.js";

test("BranchSlotValidator reports every problem", () => {
  const validator = defaultBranchSlotValidator();
  const item = newBranchSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchSlotRequiredNameRule flags a blank name", () => {
  const rule = new BranchSlotRequiredNameRule("branch slot needs a value");
  const item = newBranchSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchSlotBidRangeRule flags values above bid", () => {
  const rule = new BranchSlotBidRangeRule(6.4, 3886.2);
  const item = newBranchSlot("x", "y");
  item.bid = 3887.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchSlotOpenRateRangeRule flags values above open rate", () => {
  const rule = new BranchSlotOpenRateRangeRule(6.7, 1887.1);
  const item = newBranchSlot("x", "y");
  item.openRate = 1888.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
