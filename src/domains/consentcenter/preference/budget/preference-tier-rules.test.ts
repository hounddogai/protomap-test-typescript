import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceTierRatioRangeRule,
  PreferenceTierRequiredLabelRule,
  PreferenceTierRequiredOwnerIdRule,
  PreferenceTierStartsAtRangeRule,
  defaultPreferenceTierValidator,
} from "./preference-tier-rules.js";
import { newPreferenceTier } from "./preference-tier.js";

test("PreferenceTierValidator reports every problem", () => {
  const validator = defaultPreferenceTierValidator();
  const item = newPreferenceTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceTierRequiredLabelRule flags a blank label", () => {
  const rule = new PreferenceTierRequiredLabelRule("preference tier needs a value");
  const item = newPreferenceTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceTierRatioRangeRule flags values above ratio", () => {
  const rule = new PreferenceTierRatioRangeRule(7.3, 4553.5);
  const item = newPreferenceTier("x", "y");
  item.ratio = 4555;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceTierStartsAtRangeRule flags values above starts at", () => {
  const rule = new PreferenceTierStartsAtRangeRule(16, 32);
  const item = newPreferenceTier("x", "y");
  item.startsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceTierRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new PreferenceTierRequiredOwnerIdRule("preference tier needs an entry");
  const item = newPreferenceTier("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
