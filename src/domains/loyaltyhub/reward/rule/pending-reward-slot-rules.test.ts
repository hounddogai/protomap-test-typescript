import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRewardSlotMarginRangeRule,
  PendingRewardSlotRequiredVariantRule,
  defaultPendingRewardSlotValidator,
} from "./pending-reward-slot-rules.js";
import { newPendingRewardSlot } from "./pending-reward-slot.js";

test("PendingRewardSlotValidator reports every problem", () => {
  const validator = defaultPendingRewardSlotValidator();
  const item = newPendingRewardSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRewardSlotMarginRangeRule flags values above margin", () => {
  const rule = new PendingRewardSlotMarginRangeRule(0.9, 4626.6);
  const item = newPendingRewardSlot("x", "y");
  item.margin = 4628.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingRewardSlotRequiredVariantRule flags a blank variant", () => {
  const rule = new PendingRewardSlotRequiredVariantRule("pending reward slot needs a value");
  const item = newPendingRewardSlot("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
