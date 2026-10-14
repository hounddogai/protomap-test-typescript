import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPlacementSlotLimitRangeRule,
  RegionalPlacementSlotReviewerLengthRule,
  defaultRegionalPlacementSlotValidator,
} from "./regional-placement-slot-rules.js";
import { newRegionalPlacementSlot } from "./regional-placement-slot.js";

test("RegionalPlacementSlotValidator reports every problem", () => {
  const validator = defaultRegionalPlacementSlotValidator();
  const item = newRegionalPlacementSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPlacementSlotLimitRangeRule flags values above limit", () => {
  const rule = new RegionalPlacementSlotLimitRangeRule(120, 3600);
  const item = newRegionalPlacementSlot("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPlacementSlotReviewerLengthRule flags a long reviewer", () => {
  const rule = new RegionalPlacementSlotReviewerLengthRule(1000);
  const item = newRegionalPlacementSlot("x", "y");
  item.reviewer = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
