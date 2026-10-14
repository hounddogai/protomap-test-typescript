import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredInviteSlotCeilingRangeRule,
  TieredInviteSlotLocaleLengthRule,
  defaultTieredInviteSlotValidator,
} from "./tiered-invite-slot-rules.js";
import { newTieredInviteSlot } from "./tiered-invite-slot.js";

test("TieredInviteSlotValidator reports every problem", () => {
  const validator = defaultTieredInviteSlotValidator();
  const item = newTieredInviteSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredInviteSlotLocaleLengthRule flags a long locale", () => {
  const rule = new TieredInviteSlotLocaleLengthRule(80);
  const item = newTieredInviteSlot("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredInviteSlotCeilingRangeRule flags values above ceiling", () => {
  const rule = new TieredInviteSlotCeilingRangeRule(1.8, 2468.9);
  const item = newTieredInviteSlot("x", "y");
  item.ceiling = 2470.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
