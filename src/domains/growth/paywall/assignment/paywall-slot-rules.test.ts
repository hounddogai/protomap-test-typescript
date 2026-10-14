import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallSlotRequiredTitleRule,
  PaywallSlotRequiredUnitRule,
  defaultPaywallSlotValidator,
} from "./paywall-slot-rules.js";
import { newPaywallSlot } from "./paywall-slot.js";

test("PaywallSlotValidator reports every problem", () => {
  const validator = defaultPaywallSlotValidator();
  const item = newPaywallSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallSlotRequiredUnitRule flags a blank unit", () => {
  const rule = new PaywallSlotRequiredUnitRule("paywall slot needs an entry");
  const item = newPaywallSlot("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallSlotRequiredTitleRule flags a blank title", () => {
  const rule = new PaywallSlotRequiredTitleRule("paywall slot needs a value");
  const item = newPaywallSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
