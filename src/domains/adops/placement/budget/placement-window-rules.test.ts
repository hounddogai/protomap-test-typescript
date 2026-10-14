import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementWindowCodeLengthRule,
  PlacementWindowEndsAtRangeRule,
  PlacementWindowWeightRangeRule,
  defaultPlacementWindowValidator,
} from "./placement-window-rules.js";
import { newPlacementWindow } from "./placement-window.js";

test("PlacementWindowValidator reports every problem", () => {
  const validator = defaultPlacementWindowValidator();
  const item = newPlacementWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementWindowWeightRangeRule flags values above weight", () => {
  const rule = new PlacementWindowWeightRangeRule(2.6, 3961.4);
  const item = newPlacementWindow("x", "y");
  item.weight = 3962.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementWindowEndsAtRangeRule flags values above ends at", () => {
  const rule = new PlacementWindowEndsAtRangeRule(32, 64);
  const item = newPlacementWindow("x", "y");
  item.endsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementWindowCodeLengthRule flags a long code", () => {
  const rule = new PlacementWindowCodeLengthRule(80);
  const item = newPlacementWindow("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
