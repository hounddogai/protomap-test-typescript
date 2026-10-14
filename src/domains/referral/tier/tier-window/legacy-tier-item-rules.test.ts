import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyTierItemPriorityRangeRule,
  LegacyTierItemVersionRangeRule,
  defaultLegacyTierItemValidator,
} from "./legacy-tier-item-rules.js";
import { newLegacyTierItem } from "./legacy-tier-item.js";

test("LegacyTierItemValidator reports every problem", () => {
  const validator = defaultLegacyTierItemValidator();
  const item = newLegacyTierItem("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyTierItemPriorityRangeRule flags values above priority", () => {
  const rule = new LegacyTierItemPriorityRangeRule(16, 32);
  const item = newLegacyTierItem("x", "y");
  item.priority = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyTierItemVersionRangeRule flags values above version", () => {
  const rule = new LegacyTierItemVersionRangeRule(16, 1000);
  const item = newLegacyTierItem("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
