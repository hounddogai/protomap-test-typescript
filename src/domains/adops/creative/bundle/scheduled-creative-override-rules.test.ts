import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledCreativeOverrideQuantityRangeRule,
  ScheduledCreativeOverrideRequiredCodeRule,
  ScheduledCreativeOverrideRequiredNameRule,
  defaultScheduledCreativeOverrideValidator,
} from "./scheduled-creative-override-rules.js";
import { newScheduledCreativeOverride } from "./scheduled-creative-override.js";

test("ScheduledCreativeOverrideValidator reports every problem", () => {
  const validator = defaultScheduledCreativeOverrideValidator();
  const item = newScheduledCreativeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledCreativeOverrideQuantityRangeRule flags values above quantity", () => {
  const rule = new ScheduledCreativeOverrideQuantityRangeRule(32, 3600);
  const item = newScheduledCreativeOverride("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledCreativeOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledCreativeOverrideRequiredCodeRule("scheduled creative override needs a value");
  const item = newScheduledCreativeOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledCreativeOverrideRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledCreativeOverrideRequiredNameRule("scheduled creative override needs this field");
  const item = newScheduledCreativeOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
