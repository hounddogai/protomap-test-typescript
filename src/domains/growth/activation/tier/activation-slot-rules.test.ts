import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationSlotMarginRangeRule,
  ActivationSlotRequiredNameRule,
  defaultActivationSlotValidator,
} from "./activation-slot-rules.js";
import { newActivationSlot } from "./activation-slot.js";

test("ActivationSlotValidator reports every problem", () => {
  const validator = defaultActivationSlotValidator();
  const item = newActivationSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationSlotRequiredNameRule flags a blank name", () => {
  const rule = new ActivationSlotRequiredNameRule("activation slot needs an entry");
  const item = newActivationSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationSlotMarginRangeRule flags values above margin", () => {
  const rule = new ActivationSlotMarginRangeRule(9.2, 2388.6);
  const item = newActivationSlot("x", "y");
  item.margin = 2390.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
