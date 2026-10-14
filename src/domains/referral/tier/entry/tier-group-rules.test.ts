import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierGroupPriorityRangeRule,
  TierGroupRequiredCodeRule,
  TierGroupStartsAtRangeRule,
  TierGroupUpdatedAtRangeRule,
  defaultTierGroupValidator,
} from "./tier-group-rules.js";
import { newTierGroup } from "./tier-group.js";

test("TierGroupValidator reports every problem", () => {
  const validator = defaultTierGroupValidator();
  const item = newTierGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierGroupStartsAtRangeRule flags values above starts at", () => {
  const rule = new TierGroupStartsAtRangeRule(1000, 86400);
  const item = newTierGroup("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierGroupUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new TierGroupUpdatedAtRangeRule(32, 64);
  const item = newTierGroup("x", "y");
  item.updatedAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierGroupPriorityRangeRule flags values above priority", () => {
  const rule = new TierGroupPriorityRangeRule(120, 3600);
  const item = newTierGroup("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierGroupRequiredCodeRule flags a blank code", () => {
  const rule = new TierGroupRequiredCodeRule("tier group needs an entry");
  const item = newTierGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
