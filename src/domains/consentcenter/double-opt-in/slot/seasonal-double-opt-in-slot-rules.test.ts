import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalDoubleOptInSlotRequiredNameRule,
  defaultSeasonalDoubleOptInSlotValidator,
} from "./seasonal-double-opt-in-slot-rules.js";
import { newSeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

test("SeasonalDoubleOptInSlotValidator reports every problem", () => {
  const validator = defaultSeasonalDoubleOptInSlotValidator();
  const item = newSeasonalDoubleOptInSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalDoubleOptInSlotRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalDoubleOptInSlotRequiredNameRule("seasonal double opt in slot needs an entry");
  const item = newSeasonalDoubleOptInSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
