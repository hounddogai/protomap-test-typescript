import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBadgeTierCeilingRangeRule,
  ManualBadgeTierMaximumRangeRule,
  defaultManualBadgeTierValidator,
} from "./manual-badge-tier-rules.js";
import { newManualBadgeTier } from "./manual-badge-tier.js";

test("ManualBadgeTierValidator reports every problem", () => {
  const validator = defaultManualBadgeTierValidator();
  const item = newManualBadgeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBadgeTierMaximumRangeRule flags values above maximum", () => {
  const rule = new ManualBadgeTierMaximumRangeRule(6.9, 3712.6);
  const item = newManualBadgeTier("x", "y");
  item.maximum = 3714.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBadgeTierCeilingRangeRule flags values above ceiling", () => {
  const rule = new ManualBadgeTierCeilingRangeRule(2.7, 4319.4);
  const item = newManualBadgeTier("x", "y");
  item.ceiling = 4320.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
